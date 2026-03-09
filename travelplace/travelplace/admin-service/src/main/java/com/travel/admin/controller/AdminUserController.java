package com.travel.admin.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/*
 관리자 사용자 관리 컨트롤러

 역할
 프론트 관리자 화면 → admin-service → auth-service 내부 API 호출
 사용자 목록 조회 및 권한 변경 처리

 이전 구조
 프론트 → gateway → auth-service (AdminUserController 직접 호출)

 변경 후 구조
 프론트 → gateway → admin-service → auth-service (Eureka 내부 호출)
*/
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    // @LoadBalanced RestTemplate (RestTemplateConfig에서 등록)
    private final RestTemplate restTemplate;

    // auth-service 내부 API 기본 URL
    // Eureka가 auth-service 인스턴스 주소로 자동 변환
    private static final String AUTH_INTERNAL_URL = "http://auth-service/internal/users";

    /*
     전체 사용자 목록 조회
     auth-service 내부 API 호출 후 결과 반환
    */
    @GetMapping
    public ResponseEntity<List> getAllUsers() {
        List users = restTemplate.getForObject(AUTH_INTERNAL_URL, List.class);
        return ResponseEntity.ok(users);
    }

    /*
     사용자 권한 변경
     ADMIN ↔ USER 전환 처리
     auth-service 내부 API로 PUT 요청 전달
    */
    @PutMapping("/{username}/role")
    public ResponseEntity<Void> changeUserRole(
            @PathVariable String username,
            @RequestParam String role) {

        String url = AUTH_INTERNAL_URL + "/" + username + "/role?role=" + role;
        restTemplate.put(url, null);
        return ResponseEntity.ok().build();
    }
}
