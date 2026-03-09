package com.travel.auth.dto;

import lombok.Data;

/*
 마이페이지 수정 요청 DTO

 password 제외
 사용자 프로필 수정용
*/
@Data
public class MyPageUpdateRequest {

    private String email;
    private String phone;
    private String name;
    private String postcode;
    private String roadAddress;
    private String jibunAddress;
    private String detailAddress;
}
