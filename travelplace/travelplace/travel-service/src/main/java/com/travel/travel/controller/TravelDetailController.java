package com.travel.travel.controller;

import com.travel.travel.service.TravelDetailService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/*
 여행지 상세 조회 컨트롤러
 특정 content_id 기준 상세정보 조회
*/
@RestController
@RequestMapping("/api/travel")
@RequiredArgsConstructor
public class TravelDetailController {

    private final TravelDetailService service;

    /*
     여행지 상세 조회 API

     contentId 기준 상세 정보 반환
     */
    @GetMapping("/detail/{contentId}")
    public Map<String, Object> getDetail(
            @PathVariable String contentId
    ) {
        return service.getTravelDetail(contentId);
    }
}
