package com.travel.admin.config;

import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/*
 RestTemplate 설정

 역할
 admin-service에서 다른 서비스의 내부 API 호출 시 사용
 @LoadBalanced 어노테이션으로 Eureka 기반 동적 라우팅 활성화

 사용 예시
 restTemplate.getForObject("http://auth-service/internal/users/stats", ...)
 → Eureka에서 auth-service 인스턴스를 찾아 자동으로 라우팅
 → 인스턴스가 여러 개면 로드밸런싱도 자동 처리
*/
@Configuration
public class RestTemplateConfig {

    /*
     @LoadBalanced 어노테이션이 핵심
     이것이 없으면 http://auth-service/... 형태의 URL을 해석하지 못함
     Eureka에서 서비스 이름을 IP:Port로 변환해주는 역할
    */
    @Bean
    @LoadBalanced
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
