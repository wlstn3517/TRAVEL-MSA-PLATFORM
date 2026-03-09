package com.travel.travel.service;

import java.util.Map;

/*
 여행지 상세 조회 서비스 인터페이스
*/
public interface TravelDetailService {

    // 상세 조회 메서드
    Map<String, Object> getTravelDetail(String contentId);
}
