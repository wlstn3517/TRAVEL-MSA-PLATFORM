package com.travel.auth.service;

import com.travel.auth.domain.User;
import com.travel.auth.mapper.UserMapper;

import lombok.RequiredArgsConstructor;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

/*
 DB 사용자 인증 조회 서비스

 Spring Security 로그인 시
 username 기준 사용자 조회 담당

 UserMapper 통해 DB 조회 후
 Security UserDetails 객체로 변환
 */

@Service
@RequiredArgsConstructor
public class AuthUserDetailsService implements UserDetailsService {

	// 사용자 DB 조회 Mapper
	private final UserMapper userMapper;

	/*
	 * username으로 사용자 조회
	 * 
	 * 로그인 시 자동 호출됨
	 */
	@Override
	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

		// DB 사용자 조회
		User user = userMapper.findByUsername(username);

		// 사용자 없으면 인증 실패 처리
		if (user == null) {
			throw new UsernameNotFoundException("사용자 없음");
		}

		/*
		 * Spring Security User 객체 생성
		 * 
		 * password는 DB 암호화 값 그대로 전달 role은 ROLE prefix 붙여 권한 설정
		 */
		return new org.springframework.security.core.userdetails.User(user.getUsername(), user.getPassword(),
				Collections.singletonList(new org.springframework.security.core.authority.SimpleGrantedAuthority(
						"ROLE_" + user.getRole())));
	}
}
