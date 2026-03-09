package com.travel.domain;

import lombok.Data;

/*
 여행지 DB 저장용 내부 엔티티
 관광공사 API 데이터 적재 목적
 */
@Data
public class TravelPlace {

	// 관광공사 컨텐츠 고유 ID
	private String contentId;

	// 여행지 이름
	private String title;

	// 지역 코드
	private String areaCode;

	// 시군구 코드
	private String sigunguCode;

	// 주소 정보
	private String addr1;

	// 상세 주소
	private String addr2;

	// 대분류 카테고리
	private String cat1;

	// 중분류 카테고리
	private String cat2;

	// 소분류 카테고리
	private String cat3;

	// 대표 이미지
	private String firstImage;

	// 추가 이미지
	private String firstImage2;

	// 지도 X 좌표
	private String mapX;

	// 지도 Y 좌표
	private String mapY;

	// 수정 일자
	private String modifiedTime;

	// 생성 일자
	private String createdTime;

	// 컨텐츠 타입 ID
	private String contentTypeId;
}
