"use client";

import { useState } from "react";

interface TravelFilterProps {
  onSubmit: (filters: FilterState) => void;
}

/*
 FilterState 단순화
 기존 : region / duration / budget / styles[]
 변경 : cat1 하나만 사용
 이유 : travel_place에 예산/기간/국가 데이터 없음
        cat1(관광공사 대분류)으로 스타일 분류 가능
*/
export interface FilterState {
  cat1: string;
}

/*
 6개 여행 스타일 버튼 정의
 cat1 : 관광공사 대분류 코드 (DB travel_place.cat1 값과 동일)
 label : 화면에 표시할 한국어 이름
 icon  : 시각적 구분용 이모지
*/
const travelStyles = [
  { cat1: "A01", label: "자연",     icon: "🌿" },
  { cat1: "A02", label: "문화·역사", icon: "🏛️" },
  { cat1: "A03", label: "액티비티", icon: "🏄" },
  { cat1: "A04", label: "쇼핑",     icon: "🛍️" },
  { cat1: "A05", label: "미식",     icon: "🍽️" },
  { cat1: "B02", label: "숙박",     icon: "🏨" },
];

export function TravelFilter({ onSubmit }: TravelFilterProps) {

  /*
   선택된 cat1 코드 상태 관리
   단일 선택 방식 - 같은 버튼 재클릭 시 선택 해제
  */
  const [selectedCat1, setSelectedCat1] = useState<string>("");

  const handleStyleClick = (cat1: string) => {
    /*
     이미 선택된 버튼 재클릭 → 빈 문자열(선택 해제)
     다른 버튼 클릭 → 새 cat1 선택 + 즉시 추천 조회 (추천받기 버튼 불필요)
    */
    const next = selectedCat1 === cat1 ? "" : cat1;
    setSelectedCat1(next);
    onSubmit({ cat1: next });
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="mb-2 text-lg font-semibold text-card-foreground">
        여행 스타일
      </h2>
      <p className="text-sm text-muted-foreground mb-5">
        원하는 스타일을 선택하세요
      </p>

      {/*
       2열 그리드 버튼 6개
       선택된 버튼 : 검정 배경 (강조)
       미선택 버튼 : 흰 배경 outline 스타일
      */}
      <div className="grid grid-cols-2 gap-3">
        {travelStyles.map((style) => (
          <button
            key={style.cat1}
            onClick={() => handleStyleClick(style.cat1)}
            className={`
              flex flex-col items-center justify-center gap-1.5 p-4 rounded-lg border text-sm font-medium transition-colors
              ${selectedCat1 === style.cat1
                ? "bg-black text-white border-black"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
              }
            `}
          >
            <span className="text-2xl">{style.icon}</span>
            <span>{style.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
