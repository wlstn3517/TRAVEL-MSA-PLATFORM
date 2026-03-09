package com.travel.travel.domain;

import lombok.Data;

/*
 쿠폰 정책 테이블 매핑용

 coupon_master 대응
*/
@Data
public class CouponMaster {

    private Long couponId;
    private String couponCode;
    private String couponName;
    private String discountType;
    private Integer discountValue;
    private String travelId;
}
