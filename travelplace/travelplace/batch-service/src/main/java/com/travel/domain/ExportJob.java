package com.travel.domain;

import lombok.Data;

import java.sql.Timestamp;

/*
 엑셀 내보내기 작업(Job) 도메인

 admin_export_jobs 테이블과 1:1 매핑
 관리자가 다운로드 요청 시 이 테이블에 잡을 등록하고
 @Scheduled 워커가 PENDING → PROCESSING → COMPLETED/FAILED 순으로 상태를 변경

 상태 흐름
   PENDING    - 잡이 등록되어 처리 대기 중
   PROCESSING - 워커가 엑셀 생성 중 (중복 처리 방지용)
   COMPLETED  - 엑셀 생성 완료, file_data에 바이너리 저장됨
   FAILED     - 엑셀 생성 중 오류 발생, error_message에 원인 저장
*/
@Data
public class ExportJob {

    /*
     PK - auto increment
     잡 등록 후 이 id를 프론트에 반환 → 폴링 키로 사용
    */
    private Long id;

    /*
     내보내기 유형
     USERS   - 사용자 관리 목록 엑셀
     COUPONS - 쿠폰 발급 내역 엑셀
    */
    private String jobType;

    /*
     처리 상태
     PENDING / PROCESSING / COMPLETED / FAILED
    */
    private String status;

    /*
     요청한 관리자 username
     JWT SecurityContext에서 추출한 값
    */
    private String requestedBy;

    /*
     잡 등록 시각 - DB에서 DEFAULT NOW() 로 자동 설정
    */
    private Timestamp requestedAt;

    /*
     처리 완료 시각 - COMPLETED 또는 FAILED 상태로 업데이트 시 저장
    */
    private Timestamp completedAt;

    /*
     생성된 엑셀 파일명
     예: users_20260224.xlsx / coupons_20260224.xlsx
    */
    private String fileName;

    /*
     엑셀 파일 바이너리 데이터
     LONGBLOB 컬럼 매핑 - 완료 시 저장
     상태 조회 API에서는 이 필드를 조회하지 않음 (불필요한 BLOB 전송 방지)
     다운로드 API에서만 조회
    */
    private byte[] fileData;

    /*
     오류 메시지 - FAILED 상태 시 저장
     정상 완료 시 null
    */
    private String errorMessage;
}
