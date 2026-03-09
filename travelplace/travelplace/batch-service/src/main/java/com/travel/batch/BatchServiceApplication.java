package com.travel.batch;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.CommandLineRunner;

import com.travel.service.TourApiBatchService;

@SpringBootApplication(scanBasePackages = "com.travel")
@MapperScan("com.travel.mapper")
@EnableScheduling // 스케줄 기능 활성화
public class BatchServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(BatchServiceApplication.class, args);
    }

    // 서버 시작 시 배치 실행 테스트용
    @Bean
    CommandLineRunner run(TourApiBatchService service) {
        return args -> {
            service.executeBatch();
        };
    }
}
