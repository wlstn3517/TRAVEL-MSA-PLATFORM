package com.travel.auth.service;

import java.util.List;

import com.travel.auth.domain.User;
import com.travel.auth.dto.MyPageUpdateRequest;
import com.travel.auth.dto.SignupRequest;
import com.travel.auth.dto.UserStatsDto;

/*
 사용자 서비스 인터페이스

 회원가입 처리 전용
 */
public interface UserService {

	// 로그인용
	void signup(SignupRequest req);

	// 마이페이지 조회용 추가
	User getUserByUsername(String username);

	// 마이페이지 수정용
	void updateUser(String username, MyPageUpdateRequest req);
	// 관리자용 전체 사용자 조회
	List<User> getAllUsers();

	// 관리자용 사용자 권한 변경
	void changeUserRole(String username, String role);

	/*
	 대시보드 사용자 통계 조회
	 전체 사용자 수 오늘 가입자 수 7일 추이 반환
	*/
	UserStatsDto getUserStats();
}
