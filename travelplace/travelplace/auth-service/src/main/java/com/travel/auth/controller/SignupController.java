package com.travel.auth.controller;

import com.travel.auth.dto.SignupRequest;
import com.travel.auth.service.SignupService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/*
 회원가입 API Controller

 역할

 React 회원가입 요청 처리
 SignupService 호출하여 사용자 생성

 인증 없이 접근 가능
 SecurityConfig에서 /api/auth 허용 상태
*/

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class SignupController {

    // 회원가입 서비스
    private final SignupService signupService;

    /*
     회원가입 요청 처리

     비밀번호 암호화
     USER 권한 설정
     DB 저장 수행
    */
    @PostMapping("/signup")
    public ResponseEntity<String> signup(@RequestBody SignupRequest req) {

        signupService.signup(req);

        return ResponseEntity.ok("회원가입 완료");
    }
}
