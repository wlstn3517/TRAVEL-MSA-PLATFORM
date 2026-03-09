package com.travel.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/*
 관리자 대시보드 사용자 통계 응답 DTO

 역할
 admin-service가 /internal/users/stats 호출 시 반환되는 데이터
 대시보드 카드 및 가입자 추이 차트에 사용
*/
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserStatsDto {

    /*
     전체 가입자 수
     대시보드 상단 카드 표시용
    */
    private int totalUsers;

    /*
     오늘 가입자 수
     대시보드 상단 카드 표시용
    */
    private int todaySignups;

    /*
     최근 7일 일별 가입자 수
     대시보드 가입자 증가 추이 차트용
     [{date: "02-14", count: 5}, ...]
    */
    private List<Map<String, Object>> dailyGrowth;
}
