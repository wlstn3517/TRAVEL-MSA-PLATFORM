package com.travel.batch.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

/*
JWT 인증 필터

역할
요청 헤더 Authorization Bearer 토큰 확인
토큰 유효 시 사용자 인증 등록
토큰 없으면 인증 없이 통과

주의
로그인 회원가입 요청은 필터 제외 필요
*/

public class JwtAuthenticationFilter extends OncePerRequestFilter {

	private final JwtTokenProvider jwtTokenProvider;

	public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider) {
		this.jwtTokenProvider = jwtTokenProvider;
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {

		System.out.println("JWT FILTER 진입");
		System.out.println("요청 URI = " + request.getRequestURI());

		/*
		 * 로그인 회원가입 요청은 JWT 검사 제외 토큰 발급 전 요청이므로 반드시 통과
		 */
		String uri = request.getRequestURI();

		if (uri.startsWith("/api/auth/login") || uri.startsWith("/api/auth/signup")) {
			filterChain.doFilter(request, response);
			return;
		}

		System.out.println("Authorization Header = " + request.getHeader("Authorization"));

		/*
		 * Authorization 헤더에서 토큰 추출
		 */
		String token = resolveToken(request);

		if (token != null) {

			/*
			 * 토큰 검증 성공 시 인증 객체 생성
			 */
			if (jwtTokenProvider.validate(token)) {

				System.out.println("JWT validate 성공");

				String username = jwtTokenProvider.getUsername(token);

				/*
				 * 변경 사항 JWT payload에는 ADMIN USER 형태 저장됨 여기서 ROLE prefix 붙여 SecurityContext 등록
				 * Spring Security 권한 체크 표준 방식
				 */
				String role = jwtTokenProvider.getRole(token);
				role = "ROLE_" + role;

				SimpleGrantedAuthority authority = new SimpleGrantedAuthority(role);

				UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(username, null,
						Collections.singletonList(authority));

				/*
				 * Security Context 인증 등록 이후 Controller 권한 체크 가능
				 */
				SecurityContextHolder.getContext().setAuthentication(auth);

			} else {

				/*
				 * 토큰 검증 실패 시 인증 제거 잘못된 토큰 방지 처리
				 */
				SecurityContextHolder.clearContext();

				System.out.println("JWT 인증 실패 필터 단계");
			}
		}

		/*
		 * 변경 사항 토큰 없을 경우 기존 인증 남아있으면 제거 간헐적 인증 꼬임 방지용
		 */
		else {
			SecurityContextHolder.clearContext();
		}

		/*
		 * 다음 필터 또는 Controller 진행
		 */
		filterChain.doFilter(request, response);
	}

	/*
	 * Authorization 헤더 Bearer 토큰 추출 예 Authorization Bearer eyJhbGciOiJIUzI1NiJ9
	 */
	private String resolveToken(HttpServletRequest request) {

		String bearer = request.getHeader("Authorization");

		if (bearer == null) {
			return null;
		}

		if (!bearer.startsWith("Bearer ")) {
			return null;
		}

		return bearer.substring(7);
	}
}
