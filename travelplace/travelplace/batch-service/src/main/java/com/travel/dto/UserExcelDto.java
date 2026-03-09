package com.travel.dto;

import lombok.Data;

/*
 사용자 목록 엑셀 다운로드용 DTO

 ExportDataMapper.selectAllUsers() 쿼리 결과 매핑
 users 테이블에서 엑셀에 필요한 컬럼만 조회

 엑셀 컬럼 구성
   아이디 | 이름 | 권한
*/
@Data
public class UserExcelDto {

    /*
     사용자 아이디 (PK)
     users.username 컬럼
    */
    private String username;

    /*
     사용자 실명
     users.name 컬럼
    */
    private String name;

    /*
     권한 - USER 또는 ADMIN
     users.role 컬럼
    */
    private String role;
}
