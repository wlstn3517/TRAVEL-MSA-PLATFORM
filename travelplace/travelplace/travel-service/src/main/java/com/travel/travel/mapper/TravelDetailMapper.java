package com.travel.travel.mapper;

import org.apache.ibatis.annotations.Mapper;

import java.util.Map;

/*
 여행지 상세 조회 매퍼
*/
@Mapper
public interface TravelDetailMapper {

    // content_id 기준 상세 조회
    Map<String, Object> selectTravelDetail(String contentId);
}
