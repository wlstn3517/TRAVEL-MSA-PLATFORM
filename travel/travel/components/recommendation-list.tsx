"use client";

import { RecommendationCard } from "./recommendation-card";

/*
 API 응답 타입
 MyBatis map-underscore-to-camel-case=true 설정으로 snake_case → camelCase 자동 변환
 content_id → contentId, first_image → firstImage
*/
interface Recommendation {
  contentId:  string;  // travel_place.content_id (상세 페이지 이동용)
  title:      string;  // 여행지 이름
  addr1:      string;  // 주소 (description 대신 표시)
  firstImage: string;  // 대표 이미지 URL
  cat1:       string;  // 대분류 코드 (A01, A02 등) → 카드 태그로 표시
}

interface RecommendationListProps {
  hasSearched:     boolean;
  loading:         boolean;
  recommendations: Recommendation[];
  totalCount:      number;    // 전체 건수 (헤더 표시용)
  page:            number;    // 현재 페이지 (1부터 시작)
  totalPages:      number;    // 전체 페이지 수
  onPageChange:    (page: number) => void; // 페이지 변경 콜백 → page.tsx fetchRecommend 호출
}

export function RecommendationList({
  hasSearched,
  loading,
  recommendations,
  totalCount,
  page,
  totalPages,
  onPageChange,
}: RecommendationListProps) {

  /* 스타일 버튼 클릭 전 초기 상태 */
  if (!hasSearched) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          여행 스타일을 선택해 주세요
        </h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          왼쪽에서 원하는 여행 스타일을 선택하면 추천 여행지를 보여드립니다
        </p>
      </div>
    );
  }

  /* API 호출 중 로딩 상태 */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">여행지를 불러오는 중...</p>
      </div>
    );
  }

  /* 결과 없음 */
  if (recommendations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground">해당 스타일의 여행지가 없습니다</p>
      </div>
    );
  }

  return (
    <div>
      {/* 헤더: 전체 건수 표시 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">추천 여행지</h2>
        <span className="text-sm text-muted-foreground">
          총 {totalCount}개
        </span>
      </div>

      {/* 2열 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {recommendations.map((item) => (
          <RecommendationCard
            key={item.contentId}
            contentId={item.contentId}
            name={item.title}
            addr={item.addr1}
            imageUrl={item.firstImage}
            cat1={item.cat1}
          />
        ))}
      </div>

      {/*
       페이지네이션
       totalPages가 1 이하면 버튼 미표시
       검색 페이지(/search)와 동일한 스타일 적용
      */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">

          {/* 이전 페이지 버튼 - 첫 페이지면 비활성화 */}
          <button
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            className="px-3 py-2 border rounded disabled:opacity-40"
          >
            이전
          </button>

          {/*
           페이지 번호 버튼
           현재 페이지는 검정 배경으로 강조
           최대 5개 표시: 현재 페이지 기준 앞뒤 2개씩
          */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => Math.abs(p - page) <= 2)
            .map(p => (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`px-3 py-2 border rounded ${
                  p === page ? "bg-black text-white" : ""
                }`}
              >
                {p}
              </button>
            ))}

          {/* 다음 페이지 버튼 - 마지막 페이지면 비활성화 */}
          <button
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
            className="px-3 py-2 border rounded disabled:opacity-40"
          >
            다음
          </button>

        </div>
      )}
    </div>
  );
}
