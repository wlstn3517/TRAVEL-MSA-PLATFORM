package com.travel.auth.controller;

import com.travel.auth.domain.User;
import com.travel.auth.dto.UserStatsDto;
import com.travel.auth.service.UserService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/*
 내부 서비스 전용 사용자 API 컨트롤러

 역할
 admin-service가 Eureka를 통해 직접 호출하는 내부 전용 API
 gateway에 라우팅 등록 안 됨 외부 클라이언트 접근 불가

 이전 구조
 AdminUserController → /api/admin/users/** (gateway 통해 외부 접근)

 변경 후 구조
 InternalUserController → /internal/users/** (admin-service 내부 호출 전용)
*/
@RestController
@RequestMapping("/internal/users")
@RequiredArgsConstructor
public class InternalUserController {

    private final UserService userService;

    /*
     전체 사용자 목록 조회
     admin-service AdminUserController에서 호출
     관리자 사용자 관리 화면용
    */
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    /*
     사용자 권한 변경
     admin-service AdminUserController에서 호출
     관리자가 USER → ADMIN 또는 ADMIN → USER 변경 시 사용
    */
    @PutMapping("/{username}/role")
    public ResponseEntity<Void> changeUserRole(
            @PathVariable String username,
            @RequestParam String role) {
        userService.changeUserRole(username, role);
        return ResponseEntity.ok().build();
    }

    /*
     대시보드 사용자 통계 조회
     admin-service AdminDashboardController에서 호출
     전체 사용자 수, 오늘 가입자 수, 7일 가입 추이 반환
    */
    @GetMapping("/stats")
    public ResponseEntity<UserStatsDto> getUserStats() {
        return ResponseEntity.ok(userService.getUserStats());
    }
}
