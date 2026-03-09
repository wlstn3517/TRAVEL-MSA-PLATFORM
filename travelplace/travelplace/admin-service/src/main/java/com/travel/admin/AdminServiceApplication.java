package com.travel.admin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

/*
 Admin Service 메인 클래스

 역할
 관리자 전용 BFF(Backend For Frontend) 서비스
 auth-service, batch-service, travel-service의 내부 API를 호출하여
 관리자 화면에 필요한 데이터를 집계하고 제공

 자체 DB 없음
 데이터는 각 서비스 내부 API 호출로 획득

 포트: 8084
 gateway 라우팅: /api/admin/** → admin-service
*/
@SpringBootApplication
@EnableDiscoveryClient  // Eureka 서버에 admin-service로 등록
public class AdminServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AdminServiceApplication.class, args);
    }
}
