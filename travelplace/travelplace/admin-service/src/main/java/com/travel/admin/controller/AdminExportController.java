package com.travel.admin.controller;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/*
 관리자 엑셀 내보내기 컨트롤러 (BFF 역할)

 admin-service 는 BFF 이므로 직접 처리하지 않고
 batch-service 내부 API 로 위임하는 역할만 담당

 기존 컨트롤러들과 동일한 패턴
   AdminUserController   → http://auth-service/internal/users
   AdminBatchController  → http://batch-service/internal/batch/...
   AdminCouponController → http://travel-service/internal/coupon/...
   AdminExportController → http://batch-service/internal/export/... (신규)

 제공 API
   POST /api/admin/export/request?type=USERS|COUPONS  - 잡 등록 요청
   GET  /api/admin/export/status/{jobId}              - 상태 조회 (폴링용)
   GET  /api/admin/export/download/{jobId}            - 파일 다운로드
*/
@RestController
@RequestMapping("/api/admin/export")
@RequiredArgsConstructor
public class AdminExportController {

    /*
     @LoadBalanced RestTemplate
     RestTemplateConfig 에서 Eureka 기반 동적 라우팅 활성화
     http://batch-service/... → Eureka 가 실제 주소로 변환
    */
    private final RestTemplate restTemplate;

    /*
     batch-service 내부 엑셀 내보내기 API 기본 URL
     SecurityConfig 에서 /internal/** 허용됨 (별도 인증 불필요)
    */
    private static final String BATCH_EXPORT_URL = "http://batch-service/internal/export";

    /*
     내보내기 잡 등록 요청

     흐름
     1. JWT SecurityContext 에서 요청한 관리자 username 추출
     2. batch-service /internal/export/request 로 POST 위임
     3. batch-service 가 PENDING 잡 등록 후 jobId 반환
     4. 프론트에 jobId 전달 → 폴링 시작

     파라미터
       type - USERS (사용자 목록) 또는 COUPONS (쿠폰 발급 내역)
    */
    @PostMapping("/request")
    public ResponseEntity<Map> requestExport(
            @RequestParam String type,
            Authentication authentication) {

        /*
         JWT 필터에서 SecurityContextHolder 에 등록된 인증 정보에서 username 추출
         관리자 권한 요청이므로 authentication 은 항상 존재
        */
        String requestedBy = authentication.getName();

        /*
         batch-service 내부 API 로 위임
         type 과 requestedBy 를 쿼리 파라미터로 전달
        */
        String url = BATCH_EXPORT_URL
                + "/request?type=" + type
                + "&requestedBy=" + requestedBy;

        Map response = restTemplate.postForObject(url, null, Map.class);

        return ResponseEntity.ok(response);
    }

    /*
     잡 상태 조회 (프론트 폴링용)

     프론트가 jobId 로 일정 간격마다 호출
     batch-service 에서 status 값 (PENDING/PROCESSING/COMPLETED/FAILED) 반환
     COMPLETED 확인 시 프론트에서 다운로드 버튼 활성화
    */
    @GetMapping("/status/{jobId}")
    public ResponseEntity<Map> getStatus(@PathVariable Long jobId) {

        String url = BATCH_EXPORT_URL + "/status/" + jobId;

        Map status = restTemplate.getForObject(url, Map.class);

        if (status == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(status);
    }

    /*
     엑셀 파일 다운로드

     batch-service 에서 byte[] 로 파일을 받아 프론트로 그대로 전달
     Content-Type, Content-Disposition 헤더도 함께 전달

     exchange() 사용 이유
       getForObject() 는 헤더 접근 불가
       exchange() 는 헤더 + 바디 모두 접근 가능 → 파일 다운로드에 적합
    */
    @GetMapping("/download/{jobId}")
    public ResponseEntity<byte[]> downloadFile(@PathVariable Long jobId) {

        String url = BATCH_EXPORT_URL + "/download/" + jobId;

        /*
         batch-service 에서 파일 수신
         byte[].class 로 요청 → ByteArrayHttpMessageConverter 가 처리
        */
        ResponseEntity<byte[]> batchResponse = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                byte[].class
        );

        if (!batchResponse.getStatusCode().is2xxSuccessful()
                || batchResponse.getBody() == null) {
            return ResponseEntity.notFound().build();
        }

        /*
         batch-service 응답에서 Content-Disposition, Content-Type 헤더 추출
         프론트로 그대로 전달하여 파일명이 올바르게 표시되도록 함
        */
        HttpHeaders headers = new HttpHeaders();

        String contentDisposition = batchResponse.getHeaders()
                .getFirst(HttpHeaders.CONTENT_DISPOSITION);
        if (contentDisposition != null) {
            headers.set(HttpHeaders.CONTENT_DISPOSITION, contentDisposition);
        }

        MediaType contentType = batchResponse.getHeaders().getContentType();
        if (contentType != null) {
            headers.setContentType(contentType);
        }

        return ResponseEntity.ok()
                .headers(headers)
                .body(batchResponse.getBody());
    }
}
