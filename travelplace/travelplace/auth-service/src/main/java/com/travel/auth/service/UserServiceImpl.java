package com.travel.auth.service;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.travel.auth.domain.User;
import com.travel.auth.dto.MyPageUpdateRequest;
import com.travel.auth.dto.SignupRequest;
import com.travel.auth.dto.UserStatsDto;
import com.travel.auth.mapper.UserMapper;

import lombok.RequiredArgsConstructor;

/*
 회원가입 처리 서비스 구현체

 역할
 비밀번호 암호화
 사용자 DB 저장
 */
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void signup(SignupRequest req) {

        User user = new User();

        user.setUsername(req.getUsername());

        /*
         비밀번호 암호화 처리
         평문 저장 절대 금지
         BCrypt 방식 사용
         */
        user.setPassword(passwordEncoder.encode(req.getPassword()));

        // 기본 사용자 권한 지정
        user.setRole("USER");
        
        user.setName(req.getName());
        user.setEmail(req.getEmail());
        user.setPhone(req.getPhone());

        // 주소 API 결과 저장
        user.setPostcode(req.getPostcode());
        user.setRoadAddress(req.getRoadAddress());
        user.setJibunAddress(req.getJibunAddress());
        user.setDetailAddress(req.getDetailAddress());


        userMapper.insertUser(user);
    }
    //로그인시 사용자 찾기랑 마이페이지 시 사용자 찾기
    @Override
    public User getUserByUsername(String username) {
        return userMapper.findByUsername(username);
    }
    //마이페이지 사용자 수정 업데이트 
    @Override
    public void updateUser(String username, MyPageUpdateRequest req) {

        User user = new User();

        user.setUsername(username);
        user.setName(req.getName());

        user.setEmail(req.getEmail());
        user.setPhone(req.getPhone());
        user.setPostcode(req.getPostcode());
        user.setRoadAddress(req.getRoadAddress());
        user.setJibunAddress(req.getJibunAddress());
        user.setDetailAddress(req.getDetailAddress());

        userMapper.updateUser(user);
    }

    @Override
    public List<User> getAllUsers() {
        return userMapper.findAllUsers();
    }

    @Override
    public void changeUserRole(String username, String role) {
        userMapper.updateUserRole(username, role);
    }

    /*
     대시보드 사용자 통계 조회 구현
     전체 사용자 수, 오늘 가입자 수, 7일 가입 추이 조회
    */
    @Override
    public UserStatsDto getUserStats() {
        int totalUsers   = userMapper.countAllUsers();
        int todaySignups = userMapper.countTodayUsers();
        var dailyGrowth  = userMapper.selectDailyGrowth();
        return new UserStatsDto(totalUsers, todaySignups, dailyGrowth);
    }
}
