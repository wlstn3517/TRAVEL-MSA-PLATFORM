package com.travel.travel.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

/*
 여행지 리스트 조회 매퍼
*/
@Mapper
public interface TravelListMapper {

    // 여행지 목록 조회
    List<Map<String, Object>> selectTravelList(
            @Param("areaCode") String areaCode,
            @Param("keyword") String keyword,
            @Param("offset") int offset,
            @Param("size") int size
    );

    // 전체 건수 조회
    int selectTravelCount(
            @Param("areaCode") String areaCode,
            @Param("keyword") String keyword
    );
}
