package com.travel.travel.service;

import java.util.Map;

/*
 여행지 리스트 조회 서비스 인터페이스
*/
public interface TravelListService {

    // totalCount 포함 여행지 목록 조회
    Map<String, Object> getTravelList(
            String areaCode,
            String keyword,
            int page,
            int size
    );
}
