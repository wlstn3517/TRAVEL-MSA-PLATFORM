package com.travel.mapper;

import org.apache.ibatis.annotations.Mapper;

import com.travel.domain.TravelPlace;

/*
 여행지 데이터 DB 저장용 Mapper
 관광공사 API 데이터 적재 목적
 */
@Mapper
public interface TravelPlaceMapper {

    // 여행지 데이터 단건 저장
    int insertTravelPlace(TravelPlace place);
}
