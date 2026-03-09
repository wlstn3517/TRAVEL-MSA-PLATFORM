package com.travel.travel.controller;

import com.travel.travel.mapper.UserViewHistoryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/*
 관리자 전용 방문 이력 내부 API

 admin-service가 Eureka 통해 직접 호출
 gateway에 라우팅 없음 → 외부 접근 불가
*/
@RestController
@RequestMapping("/internal/view-history")
@RequiredArgsConstructor
public class InternalViewHistoryController {

    private final UserViewHistoryMapper userViewHistoryMapper;

    /*
     특정 사용자의 최근 방문 이력 조회
     admin-service AdminViewHistoryController에서 호출
     최신순 최대 10건 반환
    */
    @GetMapping("/{username}")
    public ResponseEntity<List<Map<String, Object>>> getHistory(
            @PathVariable String username) {

        List<Map<String, Object>> history =
                userViewHistoryMapper.findRecentByUsername(username);

        return ResponseEntity.ok(history);
    }
}
