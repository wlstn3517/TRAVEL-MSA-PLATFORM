package com.travel.admin.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/*
 관리자 배치 로그 컨트롤러

 역할
 프론트 관리자 화면 → admin-service → batch-service 내부 API 호출
 배치 로그 조회, 성공률, 실행 횟수 등 제공

 이전 구조
 프론트 → gateway → batch-service (BatchLogController 직접 호출)

 변경 후 구조
 프론트 → gateway → admin-service → batch-service (Eureka 내부 호출)
*/
@RestController
@RequestMapping("/api/admin/batch")
@RequiredArgsConstructor
public class AdminBatchController {

    // @LoadBalanced RestTemplate (RestTemplateConfig에서 등록)
    private final RestTemplate restTemplate;

    // batch-service 내부 API 기본 URL
    // Eureka가 batch-service 인스턴스 주소로 자동 변환
    private static final String BATCH_INTERNAL_URL = "http://batch-service/internal/batch";

    /*
     전체 배치 로그 목록 조회
     batch-service 내부 API 호출 후 결과 반환
     관리자 배치 로그 관리 화면용
    */
    @GetMapping("/logs")
    public ResponseEntity<List> getBatchLogs() {
        List logs = restTemplate.getForObject(BATCH_INTERNAL_URL + "/logs", List.class);
        return ResponseEntity.ok(logs);
    }

    /*
     배치 성공률 조회
     배치 로그 화면 상단 통계 카드용
    */
    @GetMapping("/success-rate")
    public ResponseEntity<Double> getSuccessRate() {
        Double rate = restTemplate.getForObject(BATCH_INTERNAL_URL + "/success-rate", Double.class);
        return ResponseEntity.ok(rate);
    }

    /*
     최근 배치 로그 조회
     최신 5건 반환
    */
    @GetMapping("/recent")
    public ResponseEntity<List> getRecentLogs() {
        List logs = restTemplate.getForObject(BATCH_INTERNAL_URL + "/recent", List.class);
        return ResponseEntity.ok(logs);
    }

    /*
     총 배치 실행 횟수 조회
     배치 로그 화면 상단 통계 카드용
    */
    @GetMapping("/count")
    public ResponseEntity<Integer> getBatchCount() {
        Integer count = restTemplate.getForObject(BATCH_INTERNAL_URL + "/count", Integer.class);
        return ResponseEntity.ok(count);
    }
}
