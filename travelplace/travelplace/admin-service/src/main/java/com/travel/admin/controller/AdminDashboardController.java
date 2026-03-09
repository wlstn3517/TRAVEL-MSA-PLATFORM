package com.travel.admin.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/*
 관리자 대시보드 컨트롤러

 역할
 관리자 대시보드 화면에 필요한 데이터를 각 서비스에서 수집하여 한 번에 반환
 BFF(Backend For Frontend) 패턴의 핵심 API

 집계 대상
 auth-service  → 전체 사용자 수, 오늘 가입자 수, 7일 가입 추이
 batch-service → 배치 성공률, 최근 배치 로그
 travel-service → 쿠폰 발급 수, 쿠폰 타입별 통계

 프론트는 이 API 하나만 호출하면 대시보드 전체 데이터 획득 가능
*/
@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    // @LoadBalanced RestTemplate (RestTemplateConfig에서 등록)
    private final RestTemplate restTemplate;

    // 각 서비스 내부 API URL
    // Eureka가 서비스 이름을 실제 주소로 자동 변환
    private static final String AUTH_STATS_URL   = "http://auth-service/internal/users/stats";
    private static final String BATCH_STATS_URL  = "http://batch-service/internal/batch/stats";
    private static final String COUPON_STATS_URL = "http://travel-service/internal/coupon/stats";

    /*
     대시보드 전체 통계 조회

     각 서비스 내부 stats API를 호출하여 결과를 하나로 합쳐 반환
     프론트에서 API 1번 호출로 대시보드 전체 데이터 획득

     응답 구조
     {
       "userStats":   { totalUsers, todaySignups, dailyGrowth },
       "batchStats":  { totalCount, successRate, recentLogs },
       "couponStats": { totalIssued, couponTypeStats, recentMasters }
     }
    */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getDashboard() {

        Map<String, Object> dashboard = new HashMap<>();

        // auth-service에서 사용자 통계 조회
        // 전체 사용자 수, 오늘 가입자 수, 7일 가입 추이
        Map userStats = restTemplate.getForObject(AUTH_STATS_URL, Map.class);
        dashboard.put("userStats", userStats);

        // batch-service에서 배치 통계 조회
        // 총 실행 횟수, 성공률, 최근 로그
        Map batchStats = restTemplate.getForObject(BATCH_STATS_URL, Map.class);
        dashboard.put("batchStats", batchStats);

        // travel-service에서 쿠폰 통계 조회
        // 전체 발급 수, 타입별 통계, 최근 쿠폰 마스터
        Map couponStats = restTemplate.getForObject(COUPON_STATS_URL, Map.class);
        dashboard.put("couponStats", couponStats);

        return ResponseEntity.ok(dashboard);
    }
}
