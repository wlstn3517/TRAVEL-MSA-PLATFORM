package com.travel.travel.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

/*
 사용자 여행지 방문 이력 Mapper

 travel-service가 이력 데이터를 소유
 user_view_history 테이블 담당
*/
@Mapper
public interface UserViewHistoryMapper {

    /*
     방문 이력 저장 또는 갱신
     같은 사용자가 같은 여행지를 다시 보면 viewed_at만 갱신 (중복 없이)
    */
    void insertOrUpdateHistory(
        @Param("username")   String username,
        @Param("contentId")  String contentId,
        @Param("title")      String title,
        @Param("firstImage") String firstImage,
        @Param("addr1")      String addr1
    );

    /*
     오래된 이력 삭제 - 최대 10건만 유지
     insert 후 10건 초과분을 뒤에서 잘라냄
    */
    void deleteOverflowHistory(@Param("username") String username);

    /*
     최근 방문 이력 조회
     viewed_at 내림차순으로 최대 10건 반환
    */
    List<Map<String, Object>> findRecentByUsername(@Param("username") String username);
}
