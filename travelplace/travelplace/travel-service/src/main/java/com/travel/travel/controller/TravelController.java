package com.travel.travel.controller;

import com.travel.travel.service.TravelListService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/*
 travel service 메인 컨트롤러

 목적
 여행지 조회 API 진입점
 gateway 통해 호출되는 실제 API
*/
@RestController
@RequiredArgsConstructor
public class TravelController {

    // 여행지 조회 서비스
    private final TravelListService travelListService;

    /*
     여행지 목록 조회 API

     기능
     지역 필터
     키워드 검색
     페이징 처리
     totalCount 포함 반환
    */
    @GetMapping("/api/travel/list")
    public Map<String, Object> list(
            @RequestParam(required = false) String areaCode,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return travelListService.getTravelList(areaCode, keyword, page, size);
    }
}
