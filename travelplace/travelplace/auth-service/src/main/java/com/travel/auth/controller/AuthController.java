package com.travel.auth.controller;

import com.travel.auth.domain.RefreshToken;
import com.travel.auth.domain.User;
import com.travel.auth.dto.LoginRequest;
import com.travel.auth.dto.LoginResponse;
import com.travel.auth.mapper.RefreshTokenMapper;
import com.travel.auth.mapper.UserMapper;
import com.travel.auth.security.JwtTokenProvider;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

/*
 구글 ID 토큰 검증용 RestTemplate
 구글 tokeninfo API를 HTTP GET으로 호출해서 사용자 정보 추출
 별도 OAuth2 라이브러리 추가 없이 spring-boot-starter-web 내 기본 포함 클래스 활용
*/
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/*
 인증 컨트롤러
 로그인 / 토큰 갱신 / 로그아웃 담당

 POST /api/auth/login   - username/password 검증 → access token + refresh token 발급
 POST /api/auth/refresh - refresh token(쿠키) 검증 → 새 access token 발급
 POST /api/auth/logout  - refresh token DB 삭제 + 쿠키 만료 처리
*/
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    /*
     구글 클라이언트 ID - application.properties에서 주입
     aud 검증에 사용: 이 토큰이 우리 앱 전용으로 발급됐는지 확인
    */
    @Value("${google.client-id}")
    private String googleClientId;

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenMapper refreshTokenMapper;
    private final UserMapper userMapper;

    public AuthController(AuthenticationManager authenticationManager,
                          JwtTokenProvider jwtTokenProvider,
                          RefreshTokenMapper refreshTokenMapper,
                          UserMapper userMapper) {
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.refreshTokenMapper = refreshTokenMapper;
        this.userMapper = userMapper;
    }

    /*
     로그인 처리

     흐름
     1. username/password 검증 (BCrypt 비교)
     2. access token 발급 (JWT, 만료 짧게 - application.properties 설정값)
     3. refresh token 발급 (UUID, DB 저장, httpOnly 쿠키로 응답)
     4. 응답 body에는 access token만 - refresh token은 쿠키로만 전달
    */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest req,
                                               HttpServletResponse response) {

        // 1. Spring Security 인증 (AuthUserDetailsService → BCrypt 검증)
        Authentication authentication = authenticationManager
                .authenticate(new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword()));

        // 2. ROLE 추출 (ROLE_ADMIN → ADMIN 형태로 prefix 제거)
        String role = "ROLE_USER";
        for (GrantedAuthority authority : authentication.getAuthorities()) {
            role = authority.getAuthority();
            break;
        }
        if (role.startsWith("ROLE_")) {
            role = role.substring(5);
        }

        // 3. access token 생성 (JWT - payload에 username + role 포함)
        String accessToken = jwtTokenProvider.createAccessToken(authentication, role);

        // 4. refresh token 생성 (UUID 랜덤 문자열 - JWT 아님)
        String refreshTokenValue = UUID.randomUUID().toString();

        // 5. 기존 refresh token 삭제 후 새 토큰 저장
        //    같은 계정으로 여러 번 로그인해도 최신 토큰만 유효하게 유지
        refreshTokenMapper.deleteByUsername(authentication.getName());

        RefreshToken rt = new RefreshToken();
        rt.setUsername(authentication.getName());
        rt.setToken(refreshTokenValue);
        rt.setExpiresAt(LocalDateTime.now().plusDays(7));
        refreshTokenMapper.insert(rt);

        // 6. refresh token → httpOnly 쿠키로 응답
        //    httpOnly : JS에서 document.cookie로 읽지 못함 → XSS 방어
        //    Path=/api/auth : 이 경로 요청에만 브라우저가 자동 쿠키 첨부
        //    MaxAge=7일 (초 단위 = 7*24*60*60)
        Cookie refreshCookie = new Cookie("refreshToken", refreshTokenValue);
        refreshCookie.setHttpOnly(true);
        refreshCookie.setPath("/api/auth");
        refreshCookie.setMaxAge(7 * 24 * 60 * 60);
        response.addCookie(refreshCookie);

        // 7. 응답 body: access token + role + username 반환
        //    username 추가 이유: 프론트 localStorage.setItem("username", data.username) 처리용
        LoginResponse resp = new LoginResponse();
        resp.setTokenType("Bearer");
        resp.setAccessToken(accessToken);
        resp.setExpiresInMs(jwtTokenProvider.getAccessTokenExpireMs());
        resp.setRole(role);
        resp.setUsername(authentication.getName());

        return ResponseEntity.ok(resp);
    }

    /*
     access token 재발급

     흐름
     1. 쿠키에서 refreshToken 값 추출 (브라우저가 자동 전송)
     2. DB 조회 - 없으면 401
     3. 만료 시각 체크 - 지났으면 401
     4. DB에서 사용자 role 조회
     5. 새 access token 발급 후 반환

     프론트 fetchWithAuth에서 401 수신 시 이 API 자동 호출
    */
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(HttpServletRequest request) {

        // 쿠키에서 refresh token 추출
        String refreshTokenValue = extractRefreshTokenFromCookie(request);

        if (refreshTokenValue == null) {
            return ResponseEntity.status(401).body("refresh token 없음");
        }

        // DB에서 토큰 조회
        RefreshToken rt = refreshTokenMapper.findByToken(refreshTokenValue);

        if (rt == null) {
            return ResponseEntity.status(401).body("유효하지 않은 refresh token");
        }

        // 만료 시각 확인 - 만료된 토큰은 DB에서도 삭제
        if (rt.getExpiresAt().isBefore(LocalDateTime.now())) {
            refreshTokenMapper.deleteByToken(refreshTokenValue);
            return ResponseEntity.status(401).body("refresh token 만료");
        }

        // DB에서 사용자 정보 조회 (role 확인용)
        User user = userMapper.findByUsername(rt.getUsername());
        if (user == null) {
            return ResponseEntity.status(401).body("사용자 없음");
        }

        // 새 access token 발급 (Authentication 객체 없이 username + role로 직접 생성)
        String newAccessToken = jwtTokenProvider.createAccessTokenForUser(
                user.getUsername(), user.getRole());

        return ResponseEntity.ok(Map.of("accessToken", newAccessToken));
    }

    /*
     로그아웃 처리

     흐름
     1. 쿠키에서 refresh token 추출
     2. DB에서 해당 토큰 삭제 → 이후 재발급 요청 거부됨 (탈취 방어)
     3. 브라우저 쿠키 만료 처리 (MaxAge=0)

     프론트에서는 이후 localStorage의 accessToken도 삭제
    */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request,
                                       HttpServletResponse response) {

        String refreshTokenValue = extractRefreshTokenFromCookie(request);

        // DB에서 refresh token 삭제
        if (refreshTokenValue != null) {
            refreshTokenMapper.deleteByToken(refreshTokenValue);
        }

        // 브라우저 쿠키 즉시 만료 (MaxAge=0 → 삭제)
        Cookie expiredCookie = new Cookie("refreshToken", "");
        expiredCookie.setHttpOnly(true);
        expiredCookie.setPath("/api/auth");
        expiredCookie.setMaxAge(0);
        response.addCookie(expiredCookie);

        return ResponseEntity.ok().build();
    }

    /*
     구글 간편 로그인 처리

     동작 흐름
     1. 프론트에서 Google Identity Services 라이브러리로 구글 로그인 팝업 표시
     2. 사용자가 구글 계정 선택 → 구글이 ID 토큰(credential) 발급
     3. 프론트가 이 엔드포인트로 credential 전송
     4. 구글 tokeninfo API 호출해 토큰 유효성 검증 + 사용자 정보 추출
     5. DB에 사용자 없으면 자동 회원가입 (이메일을 username으로 사용)
     6. JWT access token + refresh token 발급 (일반 로그인과 동일 구조)

     구글 tokeninfo API
     GET https://oauth2.googleapis.com/tokeninfo?id_token={credential}
     → email, name, sub(구글 고유 사용자 ID) 등 반환
     별도 OAuth2 라이브러리 없이 RestTemplate HTTP 호출로 처리

     관리자(ADMIN)는 이 방식으로 로그인 불가
     구글 로그인으로 생성된 계정은 항상 role = USER
    */
    @PostMapping("/google/login")
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> body,
                                         HttpServletResponse response) {

        String credential = body.get("credential");
        if (credential == null || credential.isBlank()) {
            return ResponseEntity.badRequest().body("구글 credential 없음");
        }

        // 1. 구글 tokeninfo API 호출 → ID 토큰 검증 + 사용자 정보 추출
        //    tokeninfo는 공개 API이므로 별도 API 키 불필요
        //    토큰이 위조되거나 만료됐으면 구글이 오류 응답 반환 → catch로 처리
        RestTemplate restTemplate = new RestTemplate();
        String tokenInfoUrl = "https://oauth2.googleapis.com/tokeninfo?id_token=" + credential;

        Map<String, Object> googleInfo;
        try {
            googleInfo = restTemplate.getForObject(tokenInfoUrl, Map.class);
        } catch (Exception e) {
            // 구글 토큰 검증 실패 (만료, 위조 등)
            return ResponseEntity.status(401).body("구글 토큰 검증 실패");
        }

        if (googleInfo == null || googleInfo.get("email") == null) {
            return ResponseEntity.status(401).body("구글 사용자 정보 없음");
        }

        /*
         aud(audience) 검증
         tokeninfo API는 서명만 검증하고 어느 앱용 토큰인지는 안 따짐
         aud = 이 토큰이 발급된 앱의 클라이언트 ID
         우리 클라이언트 ID와 다르면 → 다른 앱의 토큰으로 우리 서비스에 침입 시도
         → 반드시 거부해야 함
        */
        String aud = (String) googleInfo.get("aud");
        if (!googleClientId.equals(aud)) {
            return ResponseEntity.status(401).body("잘못된 클라이언트 토큰");
        }

        // 2. 구글 응답에서 사용자 정보 추출
        //    email : 구글 계정 이메일 (username으로 사용)
        //    name  : 구글 계정 표시 이름 (없으면 email 사용)
        String email = (String) googleInfo.get("email");
        String name  = googleInfo.get("name") != null ? (String) googleInfo.get("name") : email;

        // 3. DB에서 해당 이메일(= username)로 기존 사용자 조회
        //    구글 로그인은 이메일을 username PK로 사용
        //    일반 로그인 사용자(username = "john123" 등)와 충돌 없음
        User user = userMapper.findByUsername(email);

        // 4. 최초 구글 로그인 시 자동 회원가입 (DB에 없는 사용자)
        if (user == null) {
            user = new User();
            user.setUsername(email);               // 이메일을 username PK로 사용
            user.setPassword(UUID.randomUUID().toString()); // 사용 안 하는 랜덤 비밀번호 (구글 로그인 전용)
            user.setName(name);
            user.setEmail(email);
            user.setRole("USER");                  // 구글 로그인은 항상 일반 사용자
            userMapper.insertUser(user);
        }

        // 5. JWT access token 발급 (일반 로그인과 동일한 방식)
        String accessToken = jwtTokenProvider.createAccessTokenForUser(user.getUsername(), user.getRole());

        // 6. refresh token 발급 + DB 저장 (일반 로그인과 동일한 방식)
        String refreshTokenValue = UUID.randomUUID().toString();
        refreshTokenMapper.deleteByUsername(user.getUsername()); // 기존 토큰 삭제
        RefreshToken rt = new RefreshToken();
        rt.setUsername(user.getUsername());
        rt.setToken(refreshTokenValue);
        rt.setExpiresAt(LocalDateTime.now().plusDays(7));
        refreshTokenMapper.insert(rt);

        // 7. refresh token httpOnly 쿠키 설정 (일반 로그인과 동일)
        Cookie refreshCookie = new Cookie("refreshToken", refreshTokenValue);
        refreshCookie.setHttpOnly(true);
        refreshCookie.setPath("/api/auth");
        refreshCookie.setMaxAge(7 * 24 * 60 * 60);
        response.addCookie(refreshCookie);

        // 8. 응답 (일반 로그인과 동일한 구조)
        LoginResponse resp = new LoginResponse();
        resp.setTokenType("Bearer");
        resp.setAccessToken(accessToken);
        resp.setExpiresInMs(jwtTokenProvider.getAccessTokenExpireMs());
        resp.setRole(user.getRole());
        resp.setUsername(user.getUsername()); // 이메일이 username

        return ResponseEntity.ok(resp);
    }

    /*
     쿠키 배열에서 refreshToken 값을 꺼내는 헬퍼
     쿠키 없거나 refreshToken 항목 없으면 null 반환
    */
    private String extractRefreshTokenFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;

        for (Cookie c : cookies) {
            if ("refreshToken".equals(c.getName())) {
                return c.getValue();
            }
        }
        return null;
    }
}
