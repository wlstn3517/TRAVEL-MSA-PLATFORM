package com.travel.travel.service;

import java.util.Map;

public interface TravelRecommendService {

    /*
     cat1 + 페이징 기준 추천 여행지 조회

     cat1  : A01(자연), A02(문화·역사), A03(액티비티), A04(쇼핑), A05(미식), B02(숙박)
             null 또는 "" → 전체 조회
     page  : 현재 페이지 번호 (1부터 시작)
     size  : 한 페이지 건수

     반환값 Map 구조
     content    : List<Map> - 여행지 목록
     totalCount : int       - 전체 건수
     page       : int       - 현재 페이지
     size       : int       - 페이지 크기
     totalPages : int       - 전체 페이지 수 = ceil(totalCount / size)
    */
    Map<String, Object> getRecommendList(String cat1, int page, int size);
}
