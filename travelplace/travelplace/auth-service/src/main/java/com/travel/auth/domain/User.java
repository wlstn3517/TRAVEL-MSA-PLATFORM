package com.travel.auth.domain;

import java.time.LocalDateTime;

import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Data;

/*
 사용자 테이블 매핑용 엔티티
 로그인 인증과 회원가입 저장에 사용
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    /*
     PK
     username을 PK로 쓰는 설계면 이 필드를 PK로 사용
     DB에서 username을 PRIMARY KEY로 구성
     */
    private String username;

    /*
     BCrypt로 암호화된 비밀번호 저장
     평문 저장 금지
     */
    private String password;
    
	/*
	 * 사용자 이름
	 */
    private String name;

    /*
     권한
     USER 또는 ADMIN 저장
     JWT role claim 값으로 사용
     */
    private String role;

    /*
     회원가입 정보
     */
    private String email;
    private String phone;

    /*
     주소 정보
     React 회원가입 화면에서 카카오 주소 API로 받아옴
     SignupRequest DTO와 동일한 필드명으로 맞춤
     이렇게 해야 자동 매핑 또는 서비스 저장 시 혼동 없음
     */

    // 우편번호
    private String postcode;

    // 도로명 주소
    private String roadAddress;

    // 지번 주소
    private String jibunAddress;

    // 상세 주소 직접 입력값
    private String detailAddress;

    /*
     생성일시
     DB에서 NOW로 넣거나 애플리케이션에서 세팅
     */
    private LocalDateTime createdAt;
}
