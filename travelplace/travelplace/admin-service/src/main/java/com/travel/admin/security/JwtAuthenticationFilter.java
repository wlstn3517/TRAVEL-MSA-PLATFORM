package com.travel.admin.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/*
 JWT 인증 필터

 역할
 모든 요청에서 Authorization 헤더의 JWT 토큰을 추출하고 검증
 유효한 토큰이면 SecurityContextHolder에 인증 정보 등록
 이후 SecurityConfig의 권한 설정이 인증 정보를 기반으로 동작

 흐름
 1. Authorization 헤더에서 Bearer 토큰 추출
 2. JwtTokenProvider로 토큰 유효성 검증
 3. username, role 추출
 4. UsernamePasswordAuthenticationToken 생성 후 SecurityContextHolder 저장
 5. 다음 필터로 이동
*/
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        // Authorization 헤더에서 Bearer 토큰 추출
        String token = resolveToken(request);

        // 토큰이 존재하고 유효한 경우 인증 처리
        if (token != null && jwtTokenProvider.validate(token)) {

            String username = jwtTokenProvider.getUsername(token);
            String role     = jwtTokenProvider.getRole(token);

            /*
             역할 기반 권한 부여
             ROLE_ prefix를 붙여야 hasRole("ADMIN") 정상 동작
             예: ADMIN → ROLE_ADMIN
            */
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            username,
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + role))
                    );

            // SecurityContextHolder에 인증 정보 저장
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        // 다음 필터 체인으로 전달
        filterChain.doFilter(request, response);
    }

    /*
     Authorization 헤더에서 Bearer 토큰 추출
     헤더 형식: Authorization: Bearer <token>
     정상이면 토큰 문자열 반환, 아니면 null 반환
    */
    private String resolveToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (bearer != null && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }
}
