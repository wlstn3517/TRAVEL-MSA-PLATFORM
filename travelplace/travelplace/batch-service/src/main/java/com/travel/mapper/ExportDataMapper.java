package com.travel.mapper;

import com.travel.dto.CouponExcelDto;
import com.travel.dto.UserExcelDto;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

/*
 엑셀 데이터 조회 전용 Mapper

 엑셀 생성 시 필요한 사용자 목록과 쿠폰 발급 내역을 조회
 batch-service가 travel DB에 직접 접근 (같은 DataSource 사용)

 조회 대상 테이블
   users          - 사용자 목록 (username, name, role)
   travel_coupon  - 쿠폰 발급 내역
   coupon_master  - 쿠폰 정책 (JOIN)
*/
@Mapper
public interface ExportDataMapper {

    /*
     사용자 전체 목록 조회
     엑셀 컬럼: 아이디 / 이름 / 권한
    */
    List<UserExcelDto> selectAllUsers();

    /*
     쿠폰 발급 내역 전체 조회
     travel_coupon + coupon_master JOIN
     엑셀 컬럼: 사용자 / 쿠폰명 / 할인유형 / 할인값 / 여행지ID / 발급일시 / 사용여부
    */
    List<CouponExcelDto> selectAllIssuedCoupons();
}
