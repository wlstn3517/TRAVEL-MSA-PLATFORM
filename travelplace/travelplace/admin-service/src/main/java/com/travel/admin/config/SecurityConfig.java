package com.travel.admin.config;

import com.travel.admin.security.JwtAuthenticationFilter;
import com.travel.admin.security.JwtTokenProvider;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;

/*
 admin-service 보안 설정

 역할
 모든 /api/admin/** 요청은 ADMIN 권한 필요
 JWT 토큰 검증 후 role이 ADMIN인 경우에만 접근 허용

 중요
 MSA 구조에서 cors는 gateway에서만 처리
 admin-service에서는 cors 비활성화
*/
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;

    public SecurityConfig(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        JwtAuthenticationFilter jwtFilter =
                new JwtAuthenticationFilter(jwtTokenProvider);

        http
            /*
             csrf 비활성화
             JWT 인증은 세션 방식이 아니므로 csrf 불필요
            */
            .csrf(csrf -> csrf.disable())

            /*
             cors 비활성화
             MSA 구조에서 cors는 gateway에서만 처리
             admin-service에서 처리하면 헤더 중복 발생
            */
            .cors(cors -> cors.disable())

            /*
             세션 미사용 JWT 인증 구조
             서버에 로그인 상태 저장 안함
            */
            .sessionManagement(sm ->
                sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            /*
             기본 로그인 폼 비활성화
             JWT 방식에서 불필요
            */
            .formLogin(form -> form.disable())
            .logout(logout -> logout.disable())

            /*
             API 접근 권한 설정
            */
            .authorizeHttpRequests(auth -> auth

                // actuator 상태 확인 허용
                .requestMatchers("/actuator/**").permitAll()

                // 에러 페이지 허용
                .requestMatchers("/error").permitAll()

                // 모든 관리자 API는 ADMIN 권한 필요
                .requestMatchers("/api/admin/**").hasRole("ADMIN")

                // 나머지 요청 인증 필요
                .anyRequest().authenticated())

            /*
             JWT 인증 필터 등록
             UsernamePasswordAuthenticationFilter 전에 실행
            */
            .addFilterBefore(jwtFilter,
                    UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
