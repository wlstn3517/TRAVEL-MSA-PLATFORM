package com.travel.travel.config;

import com.travel.travel.security.JwtAuthenticationFilter;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/*
 travel-service 보안 설정

 여행 검색 상세는 로그인 없이 허용
 쿠폰 API만 JWT 인증 필요
*/

@Configuration
public class SecurityConfig {

    /*
     application.yml에 설정한 jwt.secret 값 읽기
     auth-service와 반드시 동일해야 함
    */
    @Value("${jwt.secret}")
    private String jwtSecret;

    /*
     JwtAuthenticationFilter Bean 등록
    */
    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter(jwtSecret);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
            .csrf(csrf -> csrf.disable())

            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/api/travel/search/**",
                    "/api/travel/detail/**"
                ).permitAll()

                .requestMatchers("/api/travel/coupon/**")
                .authenticated()

                /*
                 내부 서비스 전용 API 허용
                 admin-service가 Eureka를 통해 직접 호출하는 경로
                 gateway에는 라우팅 등록 안 됨 외부 접근 불가
                */
                .requestMatchers("/internal/**").permitAll()

                .anyRequest().permitAll()
            )

            /*
             JWT 필터 Security FilterChain에 추가
             UsernamePasswordAuthenticationFilter 전에 실행됨
            */
            .addFilterBefore(
                jwtAuthenticationFilter(),
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }
}
