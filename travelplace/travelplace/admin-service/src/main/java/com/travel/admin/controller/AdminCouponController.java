package com.travel.admin.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/*
 관리자 쿠폰 관리 컨트롤러

 역할
 프론트 관리자 화면 → admin-service → travel-service 내부 API 호출
 전체 발급 쿠폰 목록 및 쿠폰 정책(마스터) 목록 제공

 쿠폰 데이터 소유권은 travel-service에 있으므로
 admin-service는 집계 역할만 담당
*/
@RestController
@RequestMapping("/api/admin/coupon")
@RequiredArgsConstructor
public class AdminCouponController {

    // @LoadBalanced RestTemplate (RestTemplateConfig에서 등록)
    private final RestTemplate restTemplate;

    // travel-service 내부 API 기본 URL
    // Eureka가 travel-service 인스턴스 주소로 자동 변환
    private static final String TRAVEL_INTERNAL_URL = "http://travel-service/internal/coupon";

    /*
     전체 발급 쿠폰 목록 조회
     관리자 쿠폰 관리 화면에서 사용자별 발급 이력 확인용
    */
    @GetMapping("/list")
    public ResponseEntity<List> getAllIssuedCoupons() {
        List coupons = restTemplate.getForObject(TRAVEL_INTERNAL_URL + "/list", List.class);
        return ResponseEntity.ok(coupons);
    }

    /*
     쿠폰 마스터(정책) 목록 조회
     어떤 쿠폰들이 등록되어 있는지 확인용
    */
    @GetMapping("/masters")
    public ResponseEntity<List> getCouponMasters() {
        List masters = restTemplate.getForObject(TRAVEL_INTERNAL_URL + "/masters", List.class);
        return ResponseEntity.ok(masters);
    }

    /*
     쿠폰 마스터(정책) 신규 등록
     프론트 관리자 화면 → admin-service → travel-service 내부 API 위임

     요청 바디: { couponName, discountType, discountValue, travelId }
     coupon_code 는 travel-service InternalCouponController 에서 자동 생성

     반환: { couponId, couponCode, message }
    */
    @PostMapping("/master")
    public ResponseEntity<Map> createCouponMaster(@RequestBody Map<String, Object> requestBody) {

        // travel-service 내부 API 로 요청 전달
        // Content-Type: application/json 헤더 설정
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        // travel-service POST /internal/coupon/master 호출
        // 응답: { couponId, couponCode, message }
        Map result = restTemplate.postForObject(
                TRAVEL_INTERNAL_URL + "/master",
                entity,
                Map.class
        );

        return ResponseEntity.ok(result);
    }
}
