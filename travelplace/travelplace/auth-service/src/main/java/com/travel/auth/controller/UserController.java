package com.travel.auth.controller;

import com.travel.auth.domain.User;
import com.travel.auth.dto.MyPageUpdateRequest;
import com.travel.auth.service.UserService;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
/*
 마이페이지 사용자 정보 조회 Controller

 JWT 인증 사용자 정보 조회 API
 password 제외 반환
*/

@RestController
@RequiredArgsConstructor
public class UserController {

	private final UserService userService;

	@GetMapping("/api/auth/mypage")
	public User getMyPage() {

		/*
		 * JWT 인증된 username 추출 JwtAuthenticationFilter에서 principal=username 등록됨
		 */
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();

		String username = auth.getName();

		/*
		 * 사용자 조회
		 */
		User user = userService.getUserByUsername(username);

		/*
		 * password 노출 방지
		 */
		user.setPassword(null);

		return user;
	}

	@PutMapping("/api/auth/mypage")
	public void updateMyPage(@RequestBody MyPageUpdateRequest req) {

		Authentication auth = SecurityContextHolder.getContext().getAuthentication();

		String username = auth.getName();

		userService.updateUser(username, req);
	}
}
