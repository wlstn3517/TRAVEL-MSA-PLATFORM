package com.travel.auth.dto;

import lombok.Data;

/*
 회원가입 요청 DTO

 React 회원가입 화면에서 전달됨
 주소 API 데이터 포함
 */
@Data
public class SignupRequest {

    private String username; //사용자 아이디
    private String name; // 사용자 이름 
    private String password;
    private String email;
    private String phone;

    // 주소 API 결과 저장
    private String postcode;
    private String roadAddress;
    private String jibunAddress;
    private String detailAddress;
}
