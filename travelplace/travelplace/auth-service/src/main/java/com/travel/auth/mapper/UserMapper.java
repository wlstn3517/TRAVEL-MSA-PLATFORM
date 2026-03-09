package com.travel.auth.mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.travel.auth.domain.User;

/*
 사용자 DB 접근 Mapper

 목적
 로그인 시 사용자 조회
 회원가입 시 사용자 저장
 관리자 권한 조회용
 */
@Mapper
public interface UserMapper {

	/*
	 * username 기준 사용자 조회 로그인 인증 시 사용
	 */
	User findByUsername(String username);

	/*
	 * 회원가입 사용자 저장 신규 USER 등록 시 사용
	 */
	int insertUser(User user);

	/* 사용자 마이페이지에서 정보 변경 */
	int updateUser(User user);

	// 관리자용 전체 사용자 조회
	List<User> findAllUsers();

	// 관리자용 사용자 권한 변경
	int updateUserRole(@Param("username") String username, @Param("role") String role);

	/*
	 대시보드 통계용 전체 사용자 수 조회
	 admin-service 대시보드 카드 표시용
	*/
	int countAllUsers();

	/*
	 대시보드 통계용 오늘 가입자 수 조회
	 created_at 기준 오늘 날짜 필터링
	*/
	int countTodayUsers();

	/*
	 대시보드 가입자 증가 추이 조회
	 최근 7일간 일별 가입자 수 반환
	 결과: [{date: "02-14", count: 5}, ...]
	*/
	List<java.util.Map<String, Object>> selectDailyGrowth();
}
