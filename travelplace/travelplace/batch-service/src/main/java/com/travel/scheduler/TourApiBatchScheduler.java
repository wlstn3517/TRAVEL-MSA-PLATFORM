package com.travel.scheduler;

import com.travel.service.TourApiBatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import jakarta.annotation.PostConstruct;

/*
 배치 자동 실행 스케줄러
 Spring 스케줄 기능 사용
 지정 시간마다 배치 실행 담당
 */
@Component
@RequiredArgsConstructor
public class TourApiBatchScheduler {

    private final TourApiBatchService tourApiBatchService;

    // 서버 시작 보호용
    private boolean schedulerReady = false;

    /*
     서버 시작 후 5분 뒤 스케줄 활성화
    */
    @PostConstruct
    public void init() {
        new Thread(() -> {
            try {
                Thread.sleep(300000); // 5분 대기
                schedulerReady = true;
                System.out.println("스케줄러 활성화 완료");
            } catch (InterruptedException ignored) {}
        }).start();
    }

    /*
     매일 새벽 1시 실행
    */
    @Scheduled(cron = "0 0 1 * * *")
    public void runBatch() {

        // 서버 시작 직후 실행 방지
        if (!schedulerReady) {
            System.out.println("스케줄 대기 상태 - 실행 안함");
            return;
        }

        try {
            System.out.println("배치 실행 시작");

            tourApiBatchService.executeBatch();

            System.out.println("배치 실행 종료");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}