"use client"

import { useEffect, useState } from "react"

/*
 fetchWithAuth 공통 유틸 import
 - 기존: localStorage 직접 읽어 토큰 수동 세팅
 - 변경: fetchWithAuth가 자동으로 토큰 포함 + 401 시 refresh token 갱신 후 재시도
 - 효과: 토큰 만료돼도 자동 갱신되므로 관리자 페이지 튕김 방지
*/
import { fetchWithAuth } from "@/utils/fetchWithAuth"

/*
 recharts : React용 차트 라이브러리
 LineChart / Line       : 꺾은선 차트 (가입자 증가 추이)
 BarChart  / Bar        : 막대 차트 (쿠폰 발급 통계)
 XAxis / YAxis          : 가로축 / 세로축
 Tooltip                : 마우스 호버 시 데이터 팝업
 CartesianGrid          : 차트 배경 격자선
 ResponsiveContainer    : 부모 요소 크기에 맞춰 차트를 자동 리사이즈
*/
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  ResponsiveContainer,
} from "recharts"

/*
 lucide-react : 아이콘 라이브러리
 Users        : 전체 사용자 카드 아이콘
 UserPlus     : 오늘 가입자 카드 아이콘
 Ticket       : 쿠폰 발급 수 카드 아이콘 + 쿠폰 로그 아이콘
 CheckCircle  : 배치 로그 SUCCESS 상태 아이콘 (초록)
 Clock        : 배치 로그 대기/진행 상태 아이콘 + 빈 로그 안내 아이콘 (회색)
 XCircle      : 배치 로그 FAIL/ERROR 상태 아이콘 (빨강)
 TrendingUp   : 배치 성공률 카드 아이콘
*/
import {
  Users,
  UserPlus,
  Ticket,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
} from "lucide-react"

/*
 shadcn/ui Card 컴포넌트 구조
 Card            : 카드 전체 감싸는 컨테이너 (border + shadow + rounded)
 CardHeader      : 카드 상단 영역 (제목, 설명, 아이콘 배치)
 CardTitle       : 카드 제목 (굵은 텍스트)
 CardContent     : 카드 본문 영역 (주요 숫자 또는 차트/로그)
 CardDescription : 카드 부제목 (연한 회색 작은 텍스트)
*/
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card"

/*
 ScrollArea : shadcn/ui 스크롤 가능한 영역 컴포넌트
 내용이 높이를 넘으면 스크롤바 자동 표시
 로그 목록처럼 항목이 많을 때 영역 높이를 고정하고 스크롤로 탐색
*/
import { ScrollArea } from "@/components/ui/scroll-area"

/*
 Separator : shadcn/ui 가로/세로 구분선 컴포넌트
 카드 헤더와 본문 사이 시각적 구분에 사용
*/
import { Separator } from "@/components/ui/separator"

/*
 관리자 대시보드 페이지

 구성
 1 상단 통계 카드 (전체 사용자, 오늘 가입자, 쿠폰 발급 수, 배치 성공률)
 2 가입자 증가 라인 차트 (최근 7일)
 3 쿠폰 발급 통계 바 차트 (쿠폰 타입별)
 4 최근 로그 영역 (배치 로그, 쿠폰 마스터)

 API 연결
 GET /api/admin/dashboard → admin-service (BFF 패턴)
 admin-service가 auth-service, batch-service, travel-service에서
 각각 데이터를 모아 하나의 응답으로 반환
*/

export default function AdminPage() {

  /*
   상단 통계 카드 4가지 수치를 담는 상태
   totalUsers     : 전체 가입 사용자 수 (auth-service)
   todayUsers     : 오늘 신규 가입자 수 (auth-service)
   couponIssued   : 전체 쿠폰 발급 수 (travel-service)
   batchSuccessRate: 배치 성공률 % (batch-service)
  */
  const [stats, setStats] = useState({
    totalUsers:       0,
    todayUsers:       0,
    couponIssued:     0,
    batchSuccessRate: 0,
  })

  /*
   가입자 증가 라인 차트 데이터
   형식: [{ date: "MM-DD", count: 숫자 }, ...]
   auth-service의 dailyGrowth 필드에서 가져옴
  */
  const [userChartData, setUserChartData] = useState<any[]>([])

  /*
   쿠폰 발급 통계 바 차트 데이터
   형식: [{ name: "쿠폰명", issued: 숫자 }, ...]
   travel-service의 couponTypeStats 필드에서 가져옴
  */
  const [couponChartData, setCouponChartData] = useState<any[]>([])

  /*
   최근 배치 실행 로그 (하단 좌측)
   batch-service의 recentLogs 필드에서 가져옴
  */
  const [batchLogs, setBatchLogs] = useState<string[]>([])

  /*
   최근 쿠폰 마스터(정책) 생성 기록 (하단 우측)
   travel-service의 recentMasters 필드에서 가져옴
  */
  const [couponLogs, setCouponLogs] = useState<string[]>([])

  useEffect(() => {

    /*
     대시보드 API 호출 함수
     - localStorage에서 JWT accessToken 읽어 Authorization 헤더에 포함
     - NEXT_PUBLIC_API_URL 환경 변수로 게이트웨이 주소 지정 (.env.local에 설정)
     - admin-service → GET /api/admin/dashboard 단일 호출로 모든 통계 수신
    */
    const fetchDashboard = async () => {
      try {
        /*
         fetchWithAuth로 교체한 이유
         - 기존: localStorage.getItem("accessToken")으로 직접 토큰 읽어 헤더에 수동 설정
         - 문제: 토큰이 만료된 경우 401 응답을 받아도 자동 갱신 불가 → 대시보드 안 보임
         - 변경: fetchWithAuth가 토큰 포함 + 401 발생 시 refresh 엔드포인트 호출해 재발급 후 재시도
         - 효과: 관리자가 오래 머문 후 페이지 새로고침해도 대시보드 정상 표시
        */
        const res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/dashboard`
        )

        // 응답 실패 시 에러 처리
        if (!res.ok) {
          console.error("대시보드 API 호출 실패:", res.status)
          return
        }

        /*
         응답 구조 (admin-service → AdminDashboardController)
         {
           userStats:   { totalUsers, todaySignups, dailyGrowth: [{date, count}] },
           batchStats:  { totalCount, successRate, recentLogs: [{jobName, status, executedAt}] },
           couponStats: { totalIssued, couponTypeStats: [{couponName, count}], recentMasters: [{couponName, discountType, ...}] }
         }
        */
        const data = await res.json()

        /*
         상단 통계 카드 데이터 세팅
         ?? 0 : null/undefined인 경우 기본값 0으로 처리
        */
        setStats({
          totalUsers:       data.userStats?.totalUsers       ?? 0,
          todayUsers:       data.userStats?.todaySignups     ?? 0,
          couponIssued:     data.couponStats?.totalIssued    ?? 0,
          batchSuccessRate: data.batchStats?.successRate     ?? 0,
        })

        /*
         가입자 증가 라인 차트 데이터 세팅
         문제 상황: 최근 7일 내 가입자가 없으면 API가 빈 배열을 반환
                   Recharts는 데이터가 없으면 축 자체를 그리지 않아 빈 박스로 보임
         해결 방법: 최근 7일 날짜를 프론트에서 미리 생성하고
                   API 데이터가 없는 날은 count: 0으로 채워서 항상 7개 포인트 표시
        */
        const rawGrowth: { date: string; count: number }[] =
          data.userStats?.dailyGrowth ?? []

        // API 응답을 { "MM-DD": count } 형태의 Map으로 변환해 빠르게 조회
        const growthMap = new Map(
          rawGrowth.map((item) => [item.date, item.count])
        )

        // 오늘 기준 최근 7일 날짜 배열 생성 (오래된 날 → 최신 날 순서)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date()
          d.setDate(d.getDate() - (6 - i)) // 6일 전부터 오늘까지
          const mm = String(d.getMonth() + 1).padStart(2, "0")
          const dd = String(d.getDate()).padStart(2, "0")
          return `${mm}-${dd}` // "MM-DD" 형식 (SQL DATE_FORMAT과 동일)
        })

        // 7일 날짜에 API 데이터 병합, 없는 날은 0으로 채움
        const filledGrowth = last7Days.map((date) => ({
          date,
          count: growthMap.get(date) ?? 0,
        }))

        setUserChartData(filledGrowth)

        /*
         쿠폰 발급 통계 바 차트 데이터 세팅
         travel-service couponTypeStats는 { couponName, count } 형식
         차트 컴포넌트가 사용하는 { name, issued } 형식으로 변환
        */
        const couponStats = (data.couponStats?.couponTypeStats ?? []).map(
          (item: any) => ({
            name:   item.couponName,  // 쿠폰 이름 (XAxis)
            issued: item.count,       // 발급 수 (Bar 높이)
          })
        )
        setCouponChartData(couponStats)

        /*
         최근 배치 로그 세팅
         batch-service recentLogs는 { jobName, status, executedAt } 형식
         "날짜 잡이름 상태" 문자열로 조합해 표시
        */
        const batchLogLines = (data.batchStats?.recentLogs ?? []).map(
          (log: any) =>
            `${log.executedAt ?? ""} ${log.jobName ?? ""} [${log.status ?? ""}]`
        )
        setBatchLogs(batchLogLines)

        /*
         최근 쿠폰 마스터(정책) 기록 세팅
         travel-service recentMasters는 쿠폰 마스터 엔티티 목록
         "쿠폰명 (할인타입)" 문자열로 조합해 표시
        */
        const couponLogLines = (data.couponStats?.recentMasters ?? []).map(
          (master: any) =>
            `${master.couponName ?? ""} 쿠폰 (${master.discountType ?? ""})`
        )
        setCouponLogs(couponLogLines)

      } catch (err) {
        // 네트워크 오류 등 예외 상황 콘솔 출력
        console.error("대시보드 데이터 로딩 오류:", err)
      }
    }

    // 컴포넌트 마운트 시 대시보드 데이터 즉시 호출
    fetchDashboard()

  }, [])

  return (
    /*
     space-y-6 : 각 섹션(통계카드 / 차트 / 로그) 사이 세로 간격 24px
    */
    <div className="space-y-6">

      {/* 페이지 제목 영역 */}
      <div>
        {/* tracking-tight : 글자 간격을 약간 좁혀 제목 가독성 향상 */}
        <h2 className="text-2xl font-bold tracking-tight">대시보드</h2>
        {/* text-muted-foreground : shadcn 테마 변수 → 연한 회색 (부제목용) */}
        <p className="text-sm text-muted-foreground mt-1">
          서비스 현황을 한눈에 확인하세요
        </p>
      </div>

      {/* ── 상단 통계 카드 4개 ── */}
      {/*
        grid grid-cols-4 : 4열 그리드
        gap-4            : 카드 간격 16px
      */}
      <div className="grid grid-cols-4 gap-4">

        {/* 전체 사용자 카드 */}
        {/*
          Card : 카드 컨테이너 (border + shadow + rounded-xl)
          CardHeader pb-3 : 헤더 하단 패딩 줄여 숫자와 간격 조정
        */}
        <Card>
          <CardHeader className="pb-3">
            {/*
              상단 행 : 설명 텍스트(좌) + 컬러 아이콘 박스(우) 양쪽 정렬
              justify-between : 좌우 끝에 배치
            */}
            <div className="flex items-center justify-between">
              {/* CardDescription : 카드 제목 역할 (연한 회색 작은 텍스트) */}
              <CardDescription>전체 사용자</CardDescription>
              {/*
                컬러 아이콘 박스
                bg-blue-50  : 연한 파란 배경
                rounded-lg  : 모서리 둥글게
                p-2         : 아이콘 주변 여백
              */}
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            {/*
              CardTitle : 주요 수치 표시
              toLocaleString() : 숫자에 천 단위 쉼표 추가 (예: 1234 → 1,234)
            */}
            <CardTitle className="text-3xl font-bold">
              {stats.totalUsers.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">누적 가입자 수</p>
          </CardContent>
        </Card>

        {/* 오늘 가입자 카드 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>오늘 가입자</CardDescription>
              {/* bg-green-50 : 초록 계열 아이콘 박스 */}
              <div className="p-2 bg-green-50 rounded-lg">
                <UserPlus className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">
              {stats.todayUsers.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">오늘 신규 가입</p>
          </CardContent>
        </Card>

        {/* 쿠폰 발급 수 카드 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>쿠폰 발급 수</CardDescription>
              {/* bg-orange-50 : 주황 계열 아이콘 박스 */}
              <div className="p-2 bg-orange-50 rounded-lg">
                <Ticket className="w-4 h-4 text-orange-600" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">
              {stats.couponIssued.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">전체 발급된 쿠폰</p>
          </CardContent>
        </Card>

        {/* 배치 성공률 카드 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>배치 성공률</CardDescription>
              {/* bg-purple-50 : 보라 계열 아이콘 박스 */}
              <div className="p-2 bg-purple-50 rounded-lg">
                <TrendingUp className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">
              {stats.batchSuccessRate}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">배치 작업 성공률</p>
          </CardContent>
        </Card>

      </div>

      {/* ── 중단 차트 영역 ── */}
      {/* grid-cols-2 : 2열 배치 (라인차트 좌 / 바차트 우) */}
      <div className="grid grid-cols-2 gap-4">

        {/* 가입자 증가 라인 차트 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">가입자 증가 추이</CardTitle>
            <CardDescription>최근 7일 신규 가입자 현황</CardDescription>
          </CardHeader>
          <CardContent>
            {/* h-56 : 차트 컨테이너 높이 고정 (224px) */}
            <div className="h-56">
              {/*
                ResponsiveContainer : 부모 div 크기에 맞게 차트 자동 리사이즈
                width/height 100% : 부모 크기를 100% 따름
              */}
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userChartData}>
                  {/*
                    CartesianGrid
                    strokeDasharray="3 3" : 격자선을 3px 실선 + 3px 빈칸 패턴으로 표시
                    stroke="#f0f0f0"      : 격자선 색상을 연한 회색으로 (기본값보다 덜 눈에 띄게)
                  */}
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  {/*
                    XAxis dataKey="date" : userChartData의 date 필드를 가로축 레이블로 사용
                    tick fontSize 11     : 축 레이블 폰트 크기
                  */}
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  {/*
                    Tooltip contentStyle : 마우스 호버 팝업 박스 스타일 커스텀
                    fontSize 12 / borderRadius 8 / border slate 계열 : 깔끔한 팝업 디자인
                  */}
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                    }}
                  />
                  {/*
                    Line
                    type="monotone"        : 꺾인 점 없이 부드러운 곡선
                    dataKey="count"        : 세로축 값으로 count 필드 사용
                    stroke="#2563eb"       : 선 색상 (파랑)
                    strokeWidth={2}        : 선 두께
                    dot r=4 fill="#2563eb" : 각 데이터 포인트에 반지름 4px 파란 점 표시
                    activeDot r=6          : 마우스 호버 시 포인트 크기를 6px로 확대
                  */}
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#2563eb" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 쿠폰 발급 통계 바 차트 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">쿠폰 발급 통계</CardTitle>
            <CardDescription>쿠폰 타입별 발급 현황</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={couponChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  {/* XAxis dataKey="name" : couponChartData의 name(쿠폰명) 필드를 가로축으로 사용 */}
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                    }}
                  />
                  {/*
                    Bar
                    dataKey="issued"       : 세로축 값으로 issued(발급 수) 필드 사용
                    fill="#16a34a"         : 막대 색상 (초록)
                    radius=[4,4,0,0]       : 막대 상단 모서리만 둥글게 (왼위, 오위, 오아래, 왼아래 순서)
                  */}
                  <Bar dataKey="issued" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ── 하단 로그 영역 ── */}
      <div className="grid grid-cols-2 gap-4">

        {/* 최근 배치 로그 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">최근 배치 로그</CardTitle>
            <CardDescription>배치 작업 실행 기록</CardDescription>
          </CardHeader>
          {/* Separator : 헤더와 본문 사이 시각적 구분선 */}
          <Separator />
          {/* pt-4 : Separator 아래 여백 추가 */}
          <CardContent className="pt-4">
            {/*
              ScrollArea h-40 : 높이 160px 고정 후 내용 초과 시 스크롤
              로그가 많아도 카드 크기가 늘어나지 않음
            */}
            <ScrollArea className="h-40">
              {/*
                batchLogs 배열이 비어있으면 빈 상태 안내 UI 표시
                데이터가 있으면 로그 목록 렌더링
              */}
              {batchLogs.length === 0 ? (
                // 빈 상태 : 중앙 정렬 아이콘 + 안내 텍스트
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <Clock className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">배치 로그 없음</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {batchLogs.map((log, i) => {
                    /*
                     로그 문자열에서 상태 키워드를 찾아 아이콘 색상 결정
                     SUCCESS 포함 → 초록 체크 아이콘
                     FAIL / ERROR 포함 → 빨간 X 아이콘
                     그 외 → 회색 시계 아이콘 (진행중 또는 알 수 없음)
                    */
                    const isSuccess = log.includes("SUCCESS")
                    const isFail    = log.includes("FAIL") || log.includes("ERROR")
                    return (
                      <div key={i} className="flex items-start gap-2">
                        {isSuccess ? (
                          // shrink-0 : 로그 텍스트가 길어도 아이콘 크기 고정
                          <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                        ) : isFail ? (
                          <XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                        )}
                        {/*
                          font-mono      : 고정폭 폰트 (로그 텍스트 정렬 가독성 향상)
                          leading-relaxed : 줄간격을 넉넉하게 (로그 줄 겹침 방지)
                        */}
                        <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                          {log}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* 최근 쿠폰 생성 기록 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">최근 쿠폰 생성 기록</CardTitle>
            <CardDescription>새로 등록된 쿠폰 정책</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <ScrollArea className="h-40">
              {couponLogs.length === 0 ? (
                // 빈 상태 : 중앙 정렬 아이콘 + 안내 텍스트
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <Ticket className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">쿠폰 기록 없음</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {couponLogs.map((log, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {/*
                        쿠폰 아이콘 박스
                        bg-orange-50 : 연한 주황 배경으로 쿠폰 항목임을 시각적으로 표시
                      */}
                      <div className="p-1 bg-orange-50 rounded">
                        <Ticket className="w-3 h-3 text-orange-500" />
                      </div>
                      <p className="text-xs text-muted-foreground">{log}</p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

      </div>

    </div>
  )
}
