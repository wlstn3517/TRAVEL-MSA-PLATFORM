package com.travel.service;

import com.travel.domain.ExportJob;
import com.travel.dto.CouponExcelDto;
import com.travel.dto.UserExcelDto;
import com.travel.mapper.ExportDataMapper;
import com.travel.mapper.ExportJobMapper;

import lombok.RequiredArgsConstructor;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

/*
 엑셀 내보내기 잡 서비스 구현체

 핵심 역할 두 가지

 ① 잡 관리 (등록 / 조회)
    - requestExport : 프론트 요청 시 PENDING 상태로 DB 등록
    - getJobStatus  : 폴링 응답용 상태 조회 (BLOB 제외)
    - getJobForDownload : 파일 다운로드용 조회 (BLOB 포함)

 ② @Scheduled 워커 (processExportJobs)
    - 5초마다 실행 (fixedDelay = 이전 실행 완료 후 5초 대기)
    - PENDING 잡을 꺼내 PROCESSING → 엑셀 생성 → COMPLETED/FAILED
    - fixedDelay 방식이라 동시 실행 없음 (단일 인스턴스 환경 안전)
*/
@Service
@RequiredArgsConstructor
public class ExportJobServiceImpl implements ExportJobService {

    /*
     export_jobs 테이블 CRUD Mapper
    */
    private final ExportJobMapper exportJobMapper;

    /*
     엑셀 데이터 조회 Mapper (users / travel_coupon + coupon_master)
    */
    private final ExportDataMapper exportDataMapper;

    // ============================================================
    //  잡 등록 / 조회
    // ============================================================

    /*
     내보내기 잡 등록
     status = PENDING 으로 DB INSERT 후 생성된 id 반환
    */
    @Override
    public Long requestExport(String jobType, String requestedBy) {
        ExportJob job = new ExportJob();
        job.setJobType(jobType);
        job.setRequestedBy(requestedBy);
        // status 는 INSERT SQL 에서 'PENDING' 하드코딩 (XML 참고)
        exportJobMapper.insertExportJob(job);
        // useGeneratedKeys 로 자동 생성된 PK가 job.id 에 채워짐
        return job.getId();
    }

    /*
     상태 조회 - file_data 제외 (폴링용)
    */
    @Override
    public ExportJob getJobStatus(Long id) {
        return exportJobMapper.selectStatusById(id);
    }

    /*
     다운로드용 조회 - file_data 포함
    */
    @Override
    public ExportJob getJobForDownload(Long id) {
        return exportJobMapper.selectForDownload(id);
    }

    // ============================================================
    //  @Scheduled 워커 - PENDING 잡 처리
    // ============================================================

    /*
     5초마다 PENDING 잡 확인 후 엑셀 생성

     fixedDelay = 5000
       이전 실행이 완료된 후 5초 대기 → 다음 실행 시작
       fixedRate 와 달리 처리 중 중복 실행 없음

     @Scheduled 동작 조건
       BatchServiceApplication 에 @EnableScheduling 이미 선언됨
    */
    @Scheduled(fixedDelay = 5000)
    public void processExportJobs() {

        // PENDING 상태 잡 전체 조회 (등록 순 FIFO)
        List<ExportJob> pendingJobs = exportJobMapper.selectPendingJobs();

        if (pendingJobs.isEmpty()) {
            return; // 처리할 잡 없으면 즉시 종료
        }

        for (ExportJob job : pendingJobs) {
            processOneJob(job);
        }
    }

    /*
     단일 잡 처리 메서드

     흐름
     1. PENDING → PROCESSING 상태 변경 (중복 처리 방지)
     2. jobType 에 따라 엑셀 생성
     3. 성공 → COMPLETED + 파일 저장
     4. 실패 → FAILED + 오류 메시지 저장
    */
    private void processOneJob(ExportJob job) {

        // 1. PROCESSING 으로 상태 변경
        //    updateToProcessing SQL 에 AND status = 'PENDING' 조건 있음
        //    (다른 인스턴스가 이미 처리 시작한 경우 방어)
        exportJobMapper.updateToProcessing(job.getId());

        try {

            // 오늘 날짜 (파일명 suffix 용)
            // 예: 20260224
            String today = LocalDate.now()
                    .format(DateTimeFormatter.ofPattern("yyyyMMdd"));

            byte[] excelBytes;
            String fileName;

            // 2. jobType 에 따라 엑셀 생성
            if ("USERS".equals(job.getJobType())) {

                // 사용자 목록 조회 후 엑셀 생성
                List<UserExcelDto> users = exportDataMapper.selectAllUsers();
                excelBytes = generateUsersExcel(users);
                fileName   = "users_" + today + ".xlsx";

            } else if ("COUPONS".equals(job.getJobType())) {

                // 쿠폰 발급 내역 조회 후 엑셀 생성
                List<CouponExcelDto> coupons = exportDataMapper.selectAllIssuedCoupons();
                excelBytes = generateCouponsExcel(coupons);
                fileName   = "coupons_" + today + ".xlsx";

            } else {
                // 알 수 없는 jobType
                throw new IllegalArgumentException(
                        "알 수 없는 jobType: " + job.getJobType());
            }

            // 3. COMPLETED 처리 - 파일 바이너리 + 파일명 저장
            job.setFileName(fileName);
            job.setFileData(excelBytes);
            exportJobMapper.updateToCompleted(job);

            System.out.println("[ExportWorker] 완료 jobId=" + job.getId()
                    + " type=" + job.getJobType()
                    + " size=" + excelBytes.length + "bytes");

        } catch (Exception e) {

            // 4. FAILED 처리 - 오류 메시지 저장
            job.setErrorMessage(e.getMessage());
            exportJobMapper.updateToFailed(job);

            System.out.println("[ExportWorker] 실패 jobId=" + job.getId()
                    + " error=" + e.getMessage());
        }
    }

    // ============================================================
    //  엑셀 생성 내부 메서드
    // ============================================================

    /*
     사용자 목록 엑셀 생성

     컬럼: 아이디 | 이름 | 권한
     1행: 헤더 (굵게)
     2행~: 데이터
    */
    private byte[] generateUsersExcel(List<UserExcelDto> users)
            throws IOException {

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {

            Sheet sheet = workbook.createSheet("사용자 목록");

            // ---- 헤더 스타일 (굵은 글씨) ----
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            // ---- 헤더 행 (0번 행) ----
            String[] headers = { "아이디", "이름", "권한" };
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // ---- 데이터 행 (1번 행부터) ----
            for (int i = 0; i < users.size(); i++) {
                UserExcelDto u = users.get(i);
                Row row = sheet.createRow(i + 1);
                row.createCell(0).setCellValue(safeStr(u.getUsername()));
                row.createCell(1).setCellValue(safeStr(u.getName()));
                row.createCell(2).setCellValue(safeStr(u.getRole()));
            }

            // ---- 열 너비 자동 조정 ----
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            // ---- byte[] 로 변환 후 반환 ----
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    /*
     쿠폰 발급 내역 엑셀 생성

     컬럼: 사용자 | 쿠폰명 | 할인 유형 | 할인 값 | 여행지 ID | 발급 일시 | 사용 여부
     1행: 헤더 (굵게)
     2행~: 데이터
    */
    private byte[] generateCouponsExcel(List<CouponExcelDto> coupons)
            throws IOException {

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {

            Sheet sheet = workbook.createSheet("쿠폰 발급 내역");

            // ---- 헤더 스타일 (굵은 글씨) ----
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            // ---- 헤더 행 (0번 행) ----
            String[] headers = {
                "사용자", "쿠폰명", "할인 유형", "할인 값",
                "여행지 ID", "발급 일시", "사용 여부"
            };
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // ---- 데이터 행 (1번 행부터) ----
            for (int i = 0; i < coupons.size(); i++) {
                CouponExcelDto c = coupons.get(i);
                Row row = sheet.createRow(i + 1);

                row.createCell(0).setCellValue(safeStr(c.getUsername()));
                row.createCell(1).setCellValue(safeStr(c.getCouponName()));

                // 할인 유형 한글 변환
                // DB: percent / amount → 엑셀: % 할인 / 원 할인
                String discountTypeLabel = "percent".equals(c.getDiscountType())
                        ? "% 할인" : "원 할인";
                row.createCell(2).setCellValue(discountTypeLabel);

                // 할인 값 (숫자 셀로 저장)
                row.createCell(3).setCellValue(
                        c.getDiscountValue() != null ? c.getDiscountValue() : 0);

                row.createCell(4).setCellValue(safeStr(c.getTravelId()));
                row.createCell(5).setCellValue(safeStr(c.getIssuedAt()));

                // 사용 여부 한글 변환
                // DB: CHAR 타입 'Y' = 사용됨 / 'N' = 미사용
                String usedLabel = "Y".equals(c.getUsedYn())
                        ? "사용됨" : "미사용";
                row.createCell(6).setCellValue(usedLabel);
            }

            // ---- 열 너비 자동 조정 ----
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            // ---- byte[] 로 변환 후 반환 ----
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    /*
     null 안전 문자열 변환 헬퍼
     null 이면 빈 문자열 반환 (엑셀 셀에 "null" 텍스트 출력 방지)
    */
    private String safeStr(String val) {
        return val == null ? "" : val;
    }
}
