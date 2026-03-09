package com.travel.batch.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/*
 JWT 생성 및 검증 담당 클래스
 access token 발급 검증 username role expiration 관리
 refresh token은 현재 사용하지 않음
*/
@Component
public class JwtTokenProvider {

	// JWT 서명에 사용할 secret key
	private final SecretKey key;

	// access token 만료 시간 설정
	private final long accessTokenExpireMs;

	/*
	 * application.yml 또는 properties에서 jwt.secret jwt.access-token-expire-ms 값을 주입받음
	 */
	public JwtTokenProvider(@Value("${jwt.secret}") String secret,
			@Value("${jwt.access-token-expire-ms}") long accessTokenExpireMs) {
		this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
		this.accessTokenExpireMs = accessTokenExpireMs;
	}

	/*
	 * access token 생성 메소드
	 * 변경 사항
	 * JWT payload에는 ROLE prefix 없이 저장
	 * 예 ADMIN USER 형태 저장
	 */
	public String createAccessToken(Authentication authentication, String role) {

		Date now = new Date();
		Date expiry = new Date(now.getTime() + accessTokenExpireMs);

		return Jwts.builder()
				.setSubject(authentication.getName())

				// 변경 부분
				// ROLE prefix 제거 후 그대로 저장
				.claim("role", role)

				.setIssuedAt(now)
				.setExpiration(expiry)
				.signWith(key, SignatureAlgorithm.HS256)
				.compact();
	}

	public String getUsername(String token) {
		return parseClaims(token).getSubject();
	}

	public String getRole(String token) {
		Object role = parseClaims(token).get("role");
		return role == null ? null : role.toString();
	}

	public boolean validate(String token) {
		try {
			parseClaims(token);
			return true;
		} catch (Exception e) {
			System.out.println("JWT 검증 실패 " + e.getMessage());
			return false;
		}
	}

	private Claims parseClaims(String token) {
		return Jwts.parserBuilder()
				.setSigningKey(key)
				.build()
				.parseClaimsJws(token)
				.getBody();
	}

	public long getAccessTokenExpireMs() {
		return accessTokenExpireMs;
	}
}
