package com.travel.travel.controller;

import com.travel.travel.domain.CouponMaster;
import com.travel.travel.mapper.CouponMapper;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/*
 내부 서비스 전용 쿠폰 API 컨트롤러

 역할
 admin-service가 Eureka를 통해 직접 호출하는 내부 전용 API
 gateway에 라우팅 등록 안 됨 외부 클라이언트 접근 불가

 travel-service가 coupon 데이터를 소유하므로
 쿠폰 관련 admin API는 여기서 제공
*/
@RestController
@RequestMapping("/internal/coupon")
@RequiredArgsConstructor
public class InternalCouponController {

    private final CouponMapper couponMapper;

    /*
     관리자 전체 발급 쿠폰 목록 조회
     admin-service AdminCouponController에서 호출
     쿠폰 관리 화면에서 전체 발급 이력 표시용
    */
    @GetMapping("/list")
    public ResponseEntity<List<Map<String, Object>>> getAllIssuedCoupons() {
        return ResponseEntity.ok(couponMapper.findAllIssuedCoupons());
    }

    /*
     쿠폰 마스터 목록 조회
     admin-service AdminCouponController에서 호출
     쿠폰 정책 목록 표시용
    */
    @GetMapping("/masters")
    public ResponseEntity<List<CouponMaster>> getCouponMasters() {
        return ResponseEntity.ok(couponMapper.findAllCouponMasters());
    }

    /*
     대시보드 쿠폰 통계 한 번에 조회
     admin-service AdminDashboardController에서 호출
     총 발급 수, 타입별 통계, 최근 쿠폰 마스터를 묶어서 반환
    */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getCouponStats() {

        Map<String, Object> stats = new HashMap<>();

        // 전체 발급 쿠폰 수
        stats.put("totalIssued", couponMapper.countTotalIssuedCoupons());

        // 쿠폰 타입별 발급 건수 (차트용)
        stats.put("couponTypeStats", couponMapper.selectCouponTypeStats());

        // 최근 등록된 쿠폰 마스터 목록 (대시보드 최근 쿠폰 생성 기록)
        List<CouponMaster> masters = couponMapper.findAllCouponMasters();
        stats.put("recentMasters", masters.size() > 5 ? masters.subList(0, 5) : masters);

        return ResponseEntity.ok(stats);
    }

    /*
     쿠폰 마스터(정책) 신규 등록
     admin-service AdminCouponController 에서 호출
     관리자가 직접 쿠폰 정책을 생성하는 API

     coupon_code 는 이 메서드 내부에서 UUID 기반으로 자동 생성
       형식: COUP-XXXXXXXX (대문자 8자리)
       예시: COUP-A3F2B1C9
     나머지 필드(couponName, discountType, discountValue, travelId)는 요청 바디에서 수신

     반환: 생성된 coupon_code (프론트 확인용)
    */
    @PostMapping("/master")
    public ResponseEntity<Map<String, Object>> createCouponMaster(
            @RequestBody CouponMaster request) {

        // 쿠폰 코드 자동 생성
        // UUID 앞 8자리를 대문자로 변환하여 "COUP-XXXXXXXX" 형식으로 생성
        String couponCode = "COUP-" + UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 8)
                .toUpperCase();

        // 자동 생성된 쿠폰 코드 세팅
        request.setCouponCode(couponCode);

        // coupon_master 테이블에 INSERT
        // useGeneratedKeys=true 로 couponId 자동 주입됨 (CouponMapper.xml 참고)
        couponMapper.insertCouponMaster(request);

        // 생성된 coupon_code 와 coupon_id 를 응답으로 반환
        Map<String, Object> result = new HashMap<>();
        result.put("couponId",   request.getCouponId());
        result.put("couponCode", couponCode);
        result.put("message",    "쿠폰 정책이 등록되었습니다");

        return ResponseEntity.ok(result);
    }
}
