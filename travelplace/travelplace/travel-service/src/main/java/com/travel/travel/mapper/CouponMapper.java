package com.travel.travel.mapper;

import com.travel.travel.domain.CouponMaster;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/*
 쿠폰 Mapper 인터페이스

 역할

 coupon_master 쿠폰 정책 조회
 travel_coupon 발급 이력 체크
 travel_coupon 발급 insert 처리
*/

@Mapper
public interface CouponMapper {

	/*
	 * 여행지 기반 쿠폰 정책 조회 travel_id 기준 coupon_master 검색
	 */
	CouponMaster findCouponMasterByTravelId(@Param("travelId") String travelId);

	/*
	 * 사용자 쿠폰 중복 발급 체크 username coupon_id 기준
	 */
	int existsIssuedCoupon(@Param("username") String username, @Param("couponId") Long couponId);

	/*
	 * 쿠폰 발급 이력 저장
	 */
	void insertIssuedCoupon(@Param("username") String username, @Param("couponId") Long couponId,
			@Param("travelId") String travelId);

	/*
	 * 사용자 쿠폰 목록 조회
	 *
	 * 역할
	 *
	 * 마이페이지 쿠폰 이력 조회 coupon_master JOIN 포함
	 */
	List<Map<String, Object>> findMyCoupons(@Param("username") String username);

	/*
	 대시보드 통계용 전체 발급 쿠폰 수 조회
	 travel_coupon 테이블 전체 건수
	*/
	int countTotalIssuedCoupons();

	/*
	 대시보드 통계용 쿠폰 타입별 발급 건수 조회
	 coupon_master JOIN 후 쿠폰 이름별 집계
	 결과: [{couponName: "SUMMER", count: 25}, ...]
	*/
	List<Map<String, Object>> selectCouponTypeStats();

	/*
	 관리자 전체 발급 쿠폰 목록 조회
	 admin-service 쿠폰 관리 화면용
	 사용자명, 쿠폰 정보, 발급일 포함
	*/
	List<Map<String, Object>> findAllIssuedCoupons();

	/*
	 쿠폰 마스터 전체 목록 조회
	 대시보드 최근 쿠폰 생성 기록 표시용
	*/
	List<CouponMaster> findAllCouponMasters();

	/*
	 쿠폰 마스터(정책) 신규 등록
	 관리자가 쿠폰 정책을 직접 생성할 때 사용
	 coupon_code 는 호출 전 자동 생성하여 세팅 (InternalCouponController 에서 UUID 기반 생성)
	*/
	void insertCouponMaster(CouponMaster couponMaster);
}
