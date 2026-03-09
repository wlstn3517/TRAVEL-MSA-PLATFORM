package com.travel.admin.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;

/*
 JWT 토큰 검증 컴포넌트

 역할
 관리자 요청에 포함된 JWT 토큰의 유효성 검증
 토큰에서 username, role 추출

 주의
 토큰 생성은 auth-service에서만 담당
 admin-service는 검증만 수행
 auth-service와 동일한 jwt.secret을 사용해야 함
*/
@Component
public class JwtTokenProvider {

    // JWT 서명 키 auth-service와 동일한 키 사용
    private final SecretKey key;

    /*
     application.properties의 jwt.secret 값을 주입받아 서명 키 생성
     auth-service와 반드시 동일한 값이어야 토큰 검증 가능
    */
    public JwtTokenProvider(@Value("${jwt.secret}") String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /*
     JWT 토큰에서 username(subject) 추출
    */
    public String getUsername(String token) {
        return parseClaims(token).getSubject();
    }

    /*
     JWT 토큰에서 role 추출
     ADMIN 또는 USER 값 반환
    */
    public String getRole(String token) {
        Object role = parseClaims(token).get("role");
        return role == null ? null : role.toString();
    }

    /*
     JWT 토큰 유효성 검증
     서명 검증 및 만료 시간 확인
     유효하면 true, 유효하지 않으면 false 반환
    */
    public boolean validate(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (Exception e) {
            System.out.println("JWT 검증 실패: " + e.getMessage());
            return false;
        }
    }

    /*
     JWT 토큰 파싱 및 Claims 반환
     내부 메서드 외부 직접 호출 금지
    */
    private Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
