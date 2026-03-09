package com.travel.batch.config;

import com.travel.batch.security.JwtAuthenticationFilter;
import com.travel.batch.security.JwtTokenProvider;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;

/*
 시큐리티 기본 설정
 세션 사용 안함 JWT 인증 기반 구조
 관리자 사용자 권한 분리 처리

 중요

 msa 구조에서는 cors는 gateway에서만 처리
 auth service travel service 같은 내부 서비스는 cors 제거
 cors 중복 발생 시 로그인 실패 발생 가능

 추가 설명

 batch-service는 로그인 기능 없음
 JWT 검증만 수행하는 구조
*/
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;

    public SecurityConfig(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    /*
     Security 필터 체인 설정
     jwt 인증 기반 stateless 구조
    */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        JwtAuthenticationFilter jwtFilter =
                new JwtAuthenticationFilter(jwtTokenProvider);

        http
            /*
             csrf 비활성화

             jwt 인증은 세션 방식 아니므로 csrf 필요 없음
            */
            .csrf(csrf -> csrf.disable())

            /*
             cors 완전 비활성화

             msa 구조에서는 gateway에서만 cors 처리
             내부 서비스는 처리 안함
            */
            .cors(cors -> cors.disable())

            /*
             세션 미사용 jwt 인증 구조
             서버에 로그인 상태 저장 안함
            */
            .sessionManagement(sm ->
                sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            /*
             기본 로그인 폼 logout 비활성화
             jwt 구조에서는 사용 안함
            */
            .formLogin(form -> form.disable())
            .logout(logout -> logout.disable())

            /*
             api 접근 권한 설정
            */
            .authorizeHttpRequests(auth -> auth

                // spring 기본 에러 페이지 허용
                .requestMatchers("/error").permitAll()

                // actuator 모니터링 허용 필요 시만 유지
                .requestMatchers("/actuator/**").permitAll()

                /*
                 내부 서비스 전용 API 허용
                 admin-service가 Eureka를 통해 직접 호출하는 경로
                 gateway에는 라우팅 등록 안 됨 외부 접근 불가
                */
                .requestMatchers("/internal/**").permitAll()

                // 나머지 api 인증 필요
                .anyRequest().authenticated())

            /*
             jwt 인증 필터 등록
             username password filter 전에 실행
             토큰 검증 담당
            */
            .addFilterBefore(jwtFilter,
                    UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}