"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { TravelFilter, type FilterState } from "@/components/travel-filter";
import { RecommendationList } from "@/components/recommendation-list";

export default function Home() {

  /*
   추천 결과 상태
   content     : 여행지 목록 배열
   totalCount  : 전체 건수 (페이징 totalPages 계산용)
   totalPages  : 전체 페이지 수
   page        : 현재 페이지 번호 (1부터 시작)
   hasSearched : 최초 버튼 클릭 여부 (true면 결과 영역 표시)
   loading     : API 호출 중 로딩 상태
   selectedCat1: 현재 선택된 cat1 (페이지 변경 시 재조회에 사용)
  */
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [totalCount,  setTotalCount]          = useState(0);
  const [totalPages,  setTotalPages]          = useState(0);
  const [page,        setPage]                = useState(1);
  const [hasSearched, setHasSearched]         = useState(false);
  const [loading,     setLoading]             = useState(false);
  const [selectedCat1, setSelectedCat1]       = useState("");

  /*
   추천 API 호출 공통 함수
   스타일 버튼 클릭 + 페이지 변경 두 곳에서 모두 사용
  */
  const fetchRecommend = async (cat1: string, targetPage: number) => {
    setLoading(true);
    try {
      /*
       쿼리스트링 구성
       cat1이 있으면 해당 카테고리 필터링, 없으면 전체 조회
       page, size 항상 포함 (백엔드 기본값 있지만 명시적으로 전달)
      */
      const params = new URLSearchParams({ page: String(targetPage), size: "12" });
      if (cat1) params.append("cat1", cat1);

      const res  = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/travel/recommend?${params}`
      );
      const data = await res.json();

      /*
       백엔드 응답 구조
       { content: [...], totalCount: N, page: N, size: N, totalPages: N }
      */
      setRecommendations(Array.isArray(data.content) ? data.content : []);
      setTotalCount(data.totalCount  ?? 0);
      setTotalPages(data.totalPages  ?? 0);
      setPage(targetPage);
      setHasSearched(true);

    } catch (err) {
      console.error("추천 조회 오류:", err);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  /*
   스타일 버튼 클릭 시 호출 (TravelFilter → onSubmit 콜백)
   cat1 변경 시 무조건 1페이지부터 다시 조회
  */
  const handleFilterSubmit = (filters: FilterState) => {
    setSelectedCat1(filters.cat1);
    fetchRecommend(filters.cat1, 1);
  };

  /*
   페이지 변경 핸들러
   이전/다음 버튼 클릭 시 RecommendationList에서 호출
   현재 selectedCat1 유지한 채로 targetPage만 변경해서 재조회
  */
  const handlePageChange = (targetPage: number) => {
    fetchRecommend(selectedCat1, targetPage);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* 히어로 섹션 */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-3 text-balance">
            나에게 맞는 여행지를 찾아보세요
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto text-pretty">
            원하는 여행 스타일을 선택하면 딱 맞는 여행지를 추천해 드립니다
          </p>
        </div>

        {/* 메인 콘텐츠 - 좌: 필터, 우: 추천 결과 */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">

          {/* 필터 영역 */}
          <aside>
            <TravelFilter onSubmit={handleFilterSubmit} />
          </aside>

          {/* 추천 결과 영역 */}
          <section>
            <RecommendationList
              hasSearched={hasSearched}
              loading={loading}
              recommendations={recommendations}
              totalCount={totalCount}
              page={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </section>

        </div>
      </main>
    </div>
  );
}
