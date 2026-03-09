package com.travel.travel.controller;

import com.travel.travel.service.CouponService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/*
 쿠폰 발급 컨트롤러

 역할

 JWT 인증된 사용자 username 추출
 travel_id 전달하여 쿠폰 발급 요청
 중복 발급 여부는 Service에서 처리
*/

@RestController
@RequestMapping("/api/travel/coupon")
@RequiredArgsConstructor
public class CouponController {

	// 쿠폰 비즈니스 로직 서비스
	private final CouponService couponService;

	/*
	 * 쿠폰 발급 API
	 * 
	 * travelId 기준 쿠폰 자동 조회 후 발급 JWT 인증 사용자만 호출 가능
	 */
	@PostMapping("/issue/{travelId}")
	public ResponseEntity<?> issueCoupon(@PathVariable String travelId, Authentication authentication) {

		// JWT에서 username 추출
		String username = authentication.getName();

		// 서비스 호출
		couponService.issueCoupon(username, travelId);

		return ResponseEntity.ok("쿠폰 발급 완료");
	}

	/*
	 내 쿠폰 목록 조회 API

	 역할

	 로그인 사용자 쿠폰 목록 조회
	 마이페이지 쿠폰 이력 표시용
	*/
	@GetMapping("/my")
    public ResponseEntity<?> myCoupons(Authentication authentication) {

        // JWT username 추출
        String username = authentication.getName();
        System.out.println("JWT username = " + username);
        // Service 조회 호출
        return ResponseEntity.ok(
            couponService.getMyCoupons(username)
        );
	}
}
