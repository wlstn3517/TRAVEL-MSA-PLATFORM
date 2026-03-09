package com.travel.auth.mapper;

import com.travel.auth.domain.RefreshToken;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/*
 리프레시 토큰 DB 접근 Mapper

 login   → insert (기존 토큰 있으면 먼저 deleteByUsername 후 insert)
 refresh → findByToken (토큰 조회 + 만료 여부 서비스에서 체크)
 logout  → deleteByToken (해당 토큰만 삭제)
*/
@Mapper
public interface RefreshTokenMapper {

    /*
     리프레시 토큰 저장
     로그인 성공 시 호출 - 기존 토큰 삭제 후 새 토큰 insert
    */
    void insert(RefreshToken refreshToken);

    /*
     토큰 값으로 리프레시 토큰 조회
     /api/auth/refresh 호출 시 쿠키 토큰을 DB에서 검증하는 용도
    */
    RefreshToken findByToken(@Param("token") String token);

    /*
     특정 토큰 삭제
     로그아웃 시 해당 쿠키 토큰만 무효화
    */
    void deleteByToken(@Param("token") String token);

    /*
     해당 사용자의 기존 토큰 전부 삭제
     로그인 시 중복 토큰 방지 - 새 토큰 발급 전 정리
    */
    void deleteByUsername(@Param("username") String username);
}
