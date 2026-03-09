package com.travel.controller;

import com.travel.domain.BatchLog;
import com.travel.service.BatchLogService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/*
 내부 서비스 전용 배치 로그 API 컨트롤러

 역할
 admin-service가 Eureka를 통해 직접 호출하는 내부 전용 API
 gateway에 라우팅 등록 안 됨 외부 클라이언트 접근 불가

 이전 구조
 BatchLogController → /api/admin/batch/** (gateway 통해 외부 접근)

 변경 후 구조
 InternalBatchController → /internal/batch/** (admin-service 내부 호출 전용)
*/
@RestController
@RequestMapping("/internal/batch")
@RequiredArgsConstructor
public class InternalBatchController {

    private final BatchLogService batchLogService;

    /*
     전체 배치 로그 조회
     admin-service AdminBatchController에서 호출
     관리자 배치 로그 관리 화면용
    */
    @GetMapping("/logs")
    public ResponseEntity<List<BatchLog>> getBatchLogs() {
        return ResponseEntity.ok(batchLogService.getBatchLogs());
    }

    /*
     배치 성공률 조회
     admin-service AdminBatchController에서 호출
    */
    @GetMapping("/success-rate")
    public ResponseEntity<Double> getSuccessRate() {
        return ResponseEntity.ok(batchLogService.getBatchSuccessRate());
    }

    /*
     최근 배치 로그 조회
     admin-service AdminBatchController에서 호출
     최신 5건 반환
    */
    @GetMapping("/recent")
    public ResponseEntity<List<BatchLog>> getRecentLogs() {
        return ResponseEntity.ok(batchLogService.getRecentBatchLogs());
    }

    /*
     배치 총 실행 횟수 조회
     admin-service AdminBatchController에서 호출
    */
    @GetMapping("/count")
    public ResponseEntity<Integer> getBatchCount() {
        return ResponseEntity.ok(batchLogService.getBatchCount());
    }

    /*
     대시보드 배치 통계 한 번에 조회
     admin-service AdminDashboardController에서 호출
     총 횟수, 성공률, 최근 로그를 묶어서 반환
    */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getBatchStats() {

        Map<String, Object> stats = new HashMap<>();

        // 총 배치 실행 횟수
        stats.put("totalCount", batchLogService.getBatchCount());

        // 배치 성공률
        stats.put("successRate", batchLogService.getBatchSuccessRate());

        // 최근 배치 로그 (최신 3건)
        stats.put("recentLogs", batchLogService.getRecentBatchLogs());

        return ResponseEntity.ok(stats);
    }
}
