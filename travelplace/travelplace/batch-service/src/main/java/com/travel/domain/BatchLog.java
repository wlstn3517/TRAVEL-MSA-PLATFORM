package com.travel.domain;

import lombok.Data;
import java.sql.Timestamp;

/*
 배치 실행 로그 엔티티
 batch_log 테이블 매핑용
 */
@Data
public class BatchLog {

    private Long batchId;

    // 배치 작업 이름
    private String batchName;

    // 배치 시작 시간
    private Timestamp startTime;

    // 배치 종료 시간
    private Timestamp endTime;

    // 실행 상태 RUNNING SUCCESS FAIL
    private String status;

    // 처리 건수
    private Integer processedCount;

    // 오류 메시지
    private String errorMessage;

    private Timestamp regDt;
}