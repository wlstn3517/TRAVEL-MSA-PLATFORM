package com.travel.travel.service;

import com.travel.travel.mapper.TravelListMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/*
 여행지 리스트 서비스 구현체
*/
@Service
@RequiredArgsConstructor
public class TravelListServiceImpl implements TravelListService {

    // 여행지 조회 매퍼
    private final TravelListMapper travelListMapper;

    @Override
    public Map<String, Object> getTravelList(
            String areaCode,
            String keyword,
            int page,
            int size
    ) {

        // 페이징 offset 계산
        int offset = (page - 1) * size;

        // 전체 건수 조회
        int totalCount = travelListMapper.selectTravelCount(areaCode, keyword);

        // 리스트 조회
        var list = travelListMapper.selectTravelList(areaCode, keyword, offset, size);

        // 결과 Map 구성
        Map<String, Object> result = new HashMap<>();
        result.put("totalCount", totalCount);
        result.put("list", list);

        return result;
    }
}
