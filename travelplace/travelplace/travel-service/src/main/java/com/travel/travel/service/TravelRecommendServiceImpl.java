package com.travel.travel.service;

import com.travel.travel.mapper.TravelRecommendMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TravelRecommendServiceImpl implements TravelRecommendService {

    /*
     추천 조회 매퍼
     travel_place 테이블 직접 조회 (travel_recommend_meta JOIN 제거)
    */
    private final TravelRecommendMapper travelRecommendMapper;

    @Override
    public Map<String, Object> getRecommendList(String cat1, int page, int size) {

        /*
         OFFSET 계산
         page는 1부터 시작 (프론트에서 1-based로 전달)
         DB OFFSET은 0부터 시작이므로 (page - 1) * size 로 변환
         예: page=1, size=12 → offset=0 (첫 번째 행부터)
             page=2, size=12 → offset=12 (13번째 행부터)
        */
        int offset = (page - 1) * size;

        // 목록 조회
        List<Map<String, Object>> content =
                travelRecommendMapper.selectRecommendList(cat1, offset, size);

        // 전체 건수 조회 (페이징 UI의 totalPages 계산용)
        int totalCount = travelRecommendMapper.selectRecommendCount(cat1);

        /*
         totalPages 계산
         Math.ceil 사용 이유: 나머지가 있으면 페이지를 하나 더 만들어야 함
         예: totalCount=25, size=12 → ceil(25/12) = ceil(2.08) = 3페이지
        */
        int totalPages = (int) Math.ceil((double) totalCount / size);

        // 프론트에 필요한 페이징 정보 + 목록 한 번에 반환
        Map<String, Object> result = new HashMap<>();
        result.put("content",    content);
        result.put("totalCount", totalCount);
        result.put("page",       page);
        result.put("size",       size);
        result.put("totalPages", totalPages);
        return result;
    }
}
