package com.travel.travel.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface TravelRecommendMapper {

    /*
     추천 여행지 목록 조회 (페이징 포함)

     파라미터
     cat1   : 관광공사 대분류 코드 (A01 자연, A02 문화·역사, A03 액티비티, A04 쇼핑, A05 미식, B02 숙박)
              null 또는 빈 문자열이면 전체 조회
     offset : LIMIT 시작 위치 = (page - 1) * size (ServiceImpl에서 계산 후 전달)
     size   : 한 페이지에 보여줄 건수

     반환 키 camelCase 주의
     MyBatis resultType="map"은 map-underscore-to-camel-case 설정이 map 키에 적용되지 않음
     → SQL에서 AS contentId, AS firstImage 처럼 직접 alias 지정해야
       프론트 JavaScript의 item.contentId, item.firstImage 와 일치함
    */
    List<Map<String, Object>> selectRecommendList(
            @Param("cat1")   String cat1,
            @Param("offset") int    offset,
            @Param("size")   int    size
    );

    /*
     추천 여행지 전체 건수 조회
     페이징 totalPages 계산용 : totalPages = ceil(totalCount / size)
     목록 조회와 동일한 cat1 조건 적용 필수 (조건이 달라지면 건수와 실제 데이터 불일치)
    */
    int selectRecommendCount(
            @Param("cat1") String cat1
    );
}
