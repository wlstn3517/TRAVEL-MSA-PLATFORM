package com.travel.mapper;

import com.travel.domain.BatchLog;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/*
 배치 로그 DB 저장 Mapper

 역할

 1 배치 시작 로그 기록
 2 배치 종료 상태 업데이트
 3 DB named lock 관리
 4 관리자 로그 조회 및 통계 조회
*/
@Mapper
public interface BatchLogMapper {

    // 배치 시작 로그 저장
    void insertBatchStart(BatchLog log);

    // 배치 종료 로그 업데이트
    void updateBatchEnd(BatchLog log);

    // DB named lock 획득
    Integer getNamedLock(@Param("lockName") String lockName);

    // DB named lock 해제
    Integer releaseNamedLock(@Param("lockName") String lockName);

    /*
     관리자 배치 로그 전체 조회
     최신 로그부터 조회 목적
    */
    List<BatchLog> selectBatchLogs();

    /*
     전체 배치 실행 횟수 조회

     대시보드 통계용
    */
    int selectBatchCount();

    /*
     성공 배치 실행 건수 조회

     SUCCESS 상태 기준
     성공률 계산용
    */
    int selectSuccessCount();

    /*
     최근 배치 로그 조회

     대시보드 최근 실행 로그 표시용
     limit 개수만큼 조회
    */
    List<BatchLog> selectRecentBatchLogs(@Param("limit") int limit);
}