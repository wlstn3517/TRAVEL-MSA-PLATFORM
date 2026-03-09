package com.travel.travel.service;

import com.travel.travel.mapper.TravelDetailMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;

/*
 여행지 상세 조회 서비스 구현체
*/
@Service
@RequiredArgsConstructor
public class TravelDetailServiceImpl implements TravelDetailService {

    private final TravelDetailMapper mapper;

    @Override
    public Map<String, Object> getTravelDetail(String contentId) {
        return mapper.selectTravelDetail(contentId);
    }
}
