package com.travel.travel.controller;

import com.travel.travel.service.TravelRecommendService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/travel")
@RequiredArgsConstructor
public class TravelRecommendController {

    /*
     추천 서비스
     travel_place.cat1 기준 필터링 + 페이징
    */
    private final TravelRecommendService travelRecommendService;

    /*
     GET /api/travel/recommend?cat1=A01&page=1&size=12

     cat1 : 관광공사 대분류 코드 (프론트 버튼과 1:1 매핑)
       A01 - 자연, A02 - 문화·역사, A03 - 액티비티
       A04 - 쇼핑, A05 - 미식, B02 - 숙박
       미입력 시 전체 조회

     page : 페이지 번호 (기본 1) - 프론트에서 이전/다음 버튼으로 변경
     size : 페이지당 건수 (기본 12)

     응답 구조
     {
       "content"    : [...],  // 여행지 목록
       "totalCount" : 150,    // 전체 건수
       "page"       : 1,      // 현재 페이지
       "size"       : 12,     // 페이지 크기
       "totalPages" : 13      // 전체 페이지 수
     }
    */
    @GetMapping("/recommend")
    public Map<String, Object> recommend(
            @RequestParam(required = false)           String cat1,
            @RequestParam(defaultValue = "1")         int    page,
            @RequestParam(defaultValue = "12")        int    size
    ) {
        return travelRecommendService.getRecommendList(cat1, page, size);
    }
}
