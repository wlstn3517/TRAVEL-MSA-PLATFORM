package com.travel.auth.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/*
 리프레시 토큰 도메인 객체
 DB refresh_token 테이블과 1:1 매핑

 역할
 로그인 시 UUID 토큰 생성 → DB 저장
 /api/auth/refresh 호출 시 DB 조회 → 유효성 검증
 로그아웃 시 DB에서 삭제 → 이후 재발급 불가
*/
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RefreshToken {

    // DB AUTO_INCREMENT PK
    private Long id;

    // 어느 사용자의 토큰인지 (users.username FK)
    private String username;

    // 실제 토큰 값 - UUID 형태 (ex. a1b2c3d4-...)
    private String token;

    // 만료 시각 - 발급 시점 + 7일
    private LocalDateTime expiresAt;

    // 발급 시각 - DB DEFAULT NOW()로 자동 설정
    private LocalDateTime createdAt;
}
