package com.travel.controller;

import com.travel.domain.ExportJob;
import com.travel.service.ExportJobService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/*
 엑셀 내보내기 내부 전용 API 컨트롤러

 역할
 admin-service 가 Eureka 를 통해 직접 호출하는 내부 전용 API
 gateway 라우팅 미등록 → 외부 클라이언트 직접 접근 불가

 SecurityConfig 에서 /internal/** 경로는 permitAll() 처리됨
 (admin-service 에서 서비스간 호출이므로 별도 인증 불필요)

 제공 API
   POST /internal/export/request         - 잡 등록 (jobId 반환)
   GET  /internal/export/status/{jobId}  - 상태 조회 (폴링용)
   GET  /internal/export/download/{jobId} - 파일 다운로드
*/
@RestController
@RequestMapping("/internal/export")
@RequiredArgsConstructor
public class InternalExportController {

    /*
     엑셀 내보내기 잡 서비스
    */
    private final ExportJobService exportJobService;

    /*
     내보내기 잡 등록

     admin-service 가 관리자 요청을 받으면 이 API 를 호출
     DB 에 PENDING 잡을 등록하고 jobId 를 즉시 반환
     @Scheduled 워커가 비동기로 엑셀을 생성함

     파라미터
       type        - USERS 또는 COUPONS
       requestedBy - 요청한 관리자 username (JWT 에서 추출)

     응답
       { "jobId": 123 }
    */
    @PostMapping("/request")
    public ResponseEntity<Map<String, Object>> requestExport(
            @RequestParam String type,
            @RequestParam String requestedBy) {

        // 잡 등록 후 생성된 jobId 반환
        Long jobId = exportJobService.requestExport(type, requestedBy);

        Map<String, Object> response = new HashMap<>();
        response.put("jobId", jobId);

        System.out.println("[InternalExportController] 잡 등록 완료"
                + " type=" + type
                + " requestedBy=" + requestedBy
                + " jobId=" + jobId);

        return ResponseEntity.ok(response);
    }

    /*
     잡 상태 조회 (폴링용)

     프론트가 일정 간격으로 호출하여 처리 상태 확인
     file_data(LONGBLOB) 제외 → 응답 크기 최소화

     응답 예시 (PENDING/PROCESSING)
       { "id": 123, "status": "PROCESSING", "jobType": "USERS", ... }

     응답 예시 (COMPLETED)
       { "id": 123, "status": "COMPLETED", "fileName": "users_20260224.xlsx", ... }

     잡이 없으면 404 반환
    */
    @GetMapping("/status/{jobId}")
    public ResponseEntity<ExportJob> getStatus(@PathVariable Long jobId) {

        ExportJob job = exportJobService.getJobStatus(jobId);

        if (job == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(job);
    }

    /*
     엑셀 파일 다운로드

     COMPLETED 상태인 잡의 파일 바이너리를 반환
     Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
     Content-Disposition: attachment; filename*=UTF-8''파일명.xlsx

     COMPLETED 가 아니거나 잡이 없으면 404 반환
    */
    @GetMapping("/download/{jobId}")
    public ResponseEntity<byte[]> downloadFile(@PathVariable Long jobId) {

        // file_data 포함 조회
        ExportJob job = exportJobService.getJobForDownload(jobId);

        // 잡 없거나 완료 안된 경우 404
        if (job == null || !"COMPLETED".equals(job.getStatus())) {
            return ResponseEntity.notFound().build();
        }

        // 파일명 URL 인코딩 (한글 파일명 깨짐 방지)
        String encodedFileName = URLEncoder.encode(
                job.getFileName(), StandardCharsets.UTF_8)
                .replace("+", "%20"); // 공백을 %20 으로 변환

        return ResponseEntity.ok()
                /*
                 Content-Disposition
                 filename*=UTF-8'' 방식 → RFC 5987 인코딩
                 한글 파일명, 특수문자 포함 파일명 안전하게 전달
                */
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename*=UTF-8''" + encodedFileName)
                /*
                 Content-Type
                 .xlsx 파일의 공식 MIME 타입
                */
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(job.getFileData());
    }
}
