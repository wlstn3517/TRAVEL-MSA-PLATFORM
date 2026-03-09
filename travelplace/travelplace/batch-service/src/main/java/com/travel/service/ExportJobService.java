package com.travel.service;

import com.travel.domain.ExportJob;

/*
 엑셀 내보내기 잡 서비스 인터페이스

 역할
 1. 내보내기 잡 등록 (PENDING 상태로 DB 저장)
 2. 잡 상태 조회 (폴링용 - file_data 제외)
 3. 잡 다운로드용 조회 (file_data 포함)
*/
public interface ExportJobService {

    /*
     내보내기 잡 등록
     jobType  - USERS 또는 COUPONS
     requestedBy - 요청한 관리자 username
     반환값 - 등록된 잡의 id (프론트 폴링 키)
    */
    Long requestExport(String jobType, String requestedBy);

    /*
     잡 상태 조회 (file_data 제외)
     폴링 시 매번 호출되므로 BLOB 제외하여 응답 최소화
    */
    ExportJob getJobStatus(Long id);

    /*
     잡 다운로드용 조회 (file_data 포함)
     COMPLETED 상태 확인 후 파일 데이터 반환 시 사용
    */
    ExportJob getJobForDownload(Long id);
}
