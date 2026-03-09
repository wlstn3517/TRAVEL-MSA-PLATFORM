package com.travel.mapper;

import com.travel.domain.ExportJob;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/*
 엑셀 내보내기 잡 CRUD Mapper

 admin_export_jobs 테이블 대상
 SQL은 resources/mapper/ExportJobMapper.xml 에 작성
*/
@Mapper
public interface ExportJobMapper {

    /*
     새 내보내기 잡 등록
     status = PENDING 으로 시작
     등록 후 job.id 에 자동 생성된 PK 값이 채워짐 (useGeneratedKeys)
    */
    void insertExportJob(ExportJob job);

    /*
     상태 조회용 단건 조회
     file_data(LONGBLOB) 제외 - 폴링 응답에서 불필요한 BLOB 전송 방지
    */
    ExportJob selectStatusById(@Param("id") Long id);

    /*
     다운로드용 단건 조회
     file_data 포함 - 파일 다운로드 시에만 호출
    */
    ExportJob selectForDownload(@Param("id") Long id);

    /*
     PENDING 상태 잡 전체 조회
     @Scheduled 워커가 처리 대상 잡을 가져올 때 사용
    */
    List<ExportJob> selectPendingJobs();

    /*
     잡 상태를 PROCESSING 으로 변경
     워커가 처리 시작 시 호출 - 중복 처리 방지 목적
    */
    void updateToProcessing(@Param("id") Long id);

    /*
     잡 완료 처리
     status = COMPLETED, file_data, file_name, completed_at 저장
    */
    void updateToCompleted(ExportJob job);

    /*
     잡 실패 처리
     status = FAILED, error_message, completed_at 저장
    */
    void updateToFailed(ExportJob job);
}
