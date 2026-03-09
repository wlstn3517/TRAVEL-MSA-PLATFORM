package com.travel.travel.controller;

import com.travel.travel.mapper.UserViewHistoryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/*
 사용자 여행지 방문 이력 컨트롤러

 POST /api/travel/history     - 여행지 상세 진입 시 이력 저장 (자동 호출)
 GET  /api/travel/history/me  - 로그인한 사용자 본인의 최근 이력 조회 (마이페이지)
*/
@RestController
@RequestMapping("/api/travel/history")
@RequiredArgsConstructor
public class ViewHistoryController {

    private final UserViewHistoryMapper userViewHistoryMapper;

    /*
     방문 이력 저장 API

     여행지 상세 페이지 진입 시 프론트에서 자동 호출
     JWT에서 username 추출 → DB 저장
     같은 여행지 재방문이면 viewed_at만 갱신
     요청 body: { contentId, title, firstImage, addr1 }
    */
    @PostMapping
    public ResponseEntity<Void> recordHistory(@RequestBody Map<String, String> body) {

        // JWT 필터가 SecurityContext에 세팅한 인증 정보 가져오기
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        // 로그인 안 된 상태면 기록하지 않고 종료
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return ResponseEntity.ok().build();
        }

        String username   = auth.getName();
        String contentId  = body.get("contentId");
        String title      = body.get("title");
        String firstImage = body.get("firstImage");
        String addr1      = body.get("addr1");

        // contentId 없으면 무시
        if (contentId == null || contentId.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        // 이력 저장 (같은 여행지면 viewed_at 갱신)
        userViewHistoryMapper.insertOrUpdateHistory(username, contentId, title, firstImage, addr1);

        // 10건 초과 시 오래된 것 삭제
        userViewHistoryMapper.deleteOverflowHistory(username);

        return ResponseEntity.ok().build();
    }

    /*
     내 방문 이력 조회 API - 마이페이지용

     JWT 토큰에서 username을 추출해 본인 이력만 반환
     별도 파라미터 없이 토큰만으로 조회 → 다른 사람 이력 조회 불가
     최신순 최대 10건 반환
    */
    @GetMapping("/me")
    public ResponseEntity<List<Map<String, Object>>> getMyHistory() {

        // JWT 필터가 SecurityContext에 세팅한 인증 정보 가져오기
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        // 로그인 안 된 경우 빈 목록 반환
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return ResponseEntity.ok(List.of());
        }

        // JWT에서 추출한 username으로만 조회 → 본인 이력만 볼 수 있음
        String username = auth.getName();
        List<Map<String, Object>> history = userViewHistoryMapper.findRecentByUsername(username);

        return ResponseEntity.ok(history);
    }
}
