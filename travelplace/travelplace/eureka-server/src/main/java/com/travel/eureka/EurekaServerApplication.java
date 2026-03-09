package com.travel.eureka;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

/*
 Eureka Server 메인 클래스

 역할
 MSA 서비스들이 자신을 등록하는 레지스트리 서버
 각 서비스의 이름 IP 포트 상태를 관리
 gateway-service 및 admin-service가 서비스 주소를 조회할 때 사용

 실행 순서
 1. eureka-server 먼저 실행 (포트 8761)
 2. 이후 나머지 서비스 순서대로 실행
*/
@SpringBootApplication
@EnableEurekaServer  // Eureka 서버 기능 활성화
public class EurekaServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(EurekaServerApplication.class, args);
    }
}
