package com.travel.travel.service;

import com.travel.travel.domain.CouponMaster;
import com.travel.travel.mapper.CouponMapper;

import lombok.RequiredArgsConstructor;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/*
 쿠폰 발급 서비스

 역할

 travel_id 기반 쿠폰 정책 조회
 사용자 쿠폰 중복 발급 체크
 travel_coupon 테이블 발급 이력 저장

 주의

 쿠폰은 사용자당 1회 발급 제한
*/

@Service
@RequiredArgsConstructor
public class CouponService {

	// MyBatis 쿠폰 Mapper
	private final CouponMapper couponMapper;

	/*
	 * 쿠폰 발급 처리
	 * 
	 * username 로그인 사용자 travelId 여행지 ID
	 */
	@Transactional
	public void issueCoupon(String username, String travelId) {

		// 1 쿠폰 정책 조회 travel_id 기준
		CouponMaster coupon = couponMapper.findCouponMasterByTravelId(travelId);

		if (coupon == null) {
			throw new RuntimeException("해당 여행 쿠폰 없음");
		}

		// 2 중복 발급 체크 사용자 1회 제한
		int exists = couponMapper.existsIssuedCoupon(username, coupon.getCouponId());

		if (exists > 0) {
			throw new RuntimeException("이미 발급된 쿠폰입니다");
		}

		// 3 쿠폰 발급 이력 저장
		couponMapper.insertIssuedCoupon(username, coupon.getCouponId(), travelId);
	}

	/*
	 * 내 쿠폰 목록 조회
	 * 
	 * 역할
	 * 
	 * 로그인 사용자 쿠폰 목록 조회 마이페이지 쿠폰 이력 표시용
	 */
	public List<Map<String, Object>> getMyCoupons(String username) {
	    return couponMapper.findMyCoupons(username);
	}
}
