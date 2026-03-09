package com.travel.dto;

import lombok.Data;

/*
 쿠폰 발급 내역 엑셀 다운로드용 DTO

 ExportDataMapper.selectAllIssuedCoupons() 쿼리 결과 매핑
 travel_coupon (발급 내역) + coupon_master (쿠폰 정책) JOIN 결과

 엑셀 컬럼 구성
   사용자 | 쿠폰명 | 할인 유형 | 할인 값 | 여행지 ID | 발급 일시 | 사용 여부
*/
@Data
public class CouponExcelDto {

    /*
     쿠폰을 발급받은 사용자 아이디
     travel_coupon.username 컬럼
    */
    private String username;

    /*
     쿠폰 이름
     coupon_master.coupon_name 컬럼 (JOIN)
    */
    private String couponName;

    /*
     할인 유형
     percent - 퍼센트 할인 / amount - 금액 할인
     coupon_master.discount_type 컬럼 (JOIN)
    */
    private String discountType;

    /*
     할인 값 (숫자)
     percent 일 때: 10 → 10% 할인
     amount 일 때: 5000 → 5000원 할인
     coupon_master.discount_value 컬럼 (JOIN)
    */
    private Integer discountValue;

    /*
     연결된 여행지 ID
     travel_coupon.travel_id 컬럼
    */
    private String travelId;

    /*
     발급 일시 (문자열로 포맷)
     예: 2026-02-24 10:30:00
    */
    private String issuedAt;

    /*
     사용 여부
     travel_coupon.used_yn 컬럼
     DB에 CHAR 타입 'Y' / 'N' 으로 저장됨
     'Y' = 사용됨 / 'N' = 미사용
     Integer 로 선언 시 MyBatis 변환 오류 발생 → String 으로 선언
    */
    private String usedYn;
}
