"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { DestinationCard } from "@/components/destination-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

// 지역코드 
const REGIONS = [
  { value: "all", label: "전체 지역" },

  { value: "1", label: "서울" },
  { value: "2", label: "인천" },
  { value: "3", label: "대전" },
  { value: "4", label: "대구" },
  { value: "5", label: "광주" },
  { value: "6", label: "부산" },
  { value: "7", label: "울산" },
  { value: "8", label: "세종" },

  { value: "31", label: "경기" },
  { value: "32", label: "강원" },
  { value: "33", label: "충북" },
  { value: "34", label: "충남" },
  { value: "35", label: "경북" },
  { value: "36", label: "경남" },
  { value: "37", label: "전북" },
  { value: "38", label: "전남" },
  { value: "39", label: "제주" },
];

export default function SearchPage() {

  const [selectedRegion, setSelectedRegion] = useState("all");

  // 검색 키워드 상태 추가
  const [keyword, setKeyword] = useState("");

  const [page, setPage] = useState(1);
  const size = 12;

  const [travelList, setTravelList] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  /*
   API 호출
   keyword 존재 시 전국 검색
   없으면 지역 필터 적용
  */
  const fetchTravelList = async (
    region = "all",
    currentPage = 1,
    searchKeyword = ""
  ) => {

    let url = `http://localhost:8080/api/travel/list?page=${currentPage}&size=${size}`;

    // 검색어 있으면 keyword 우선 적용
    if (searchKeyword) {
      url += `&keyword=${searchKeyword}`;
    }
    // 검색어 없으면 지역 필터 적용
    else if (region !== "all") {
      url += `&areaCode=${region}`;
    }

    const res = await fetch(url);
    const data = await res.json();

    setTravelList(data.list);
    setTotalCount(data.totalCount);
  };

  /*
   지역 변경 시 검색어 초기화 후 조회
  */
  useEffect(() => {
    setKeyword("");
    setPage(1);
    fetchTravelList(selectedRegion, 1, "");
  }, [selectedRegion]);

  /*
   페이지 변경 시 조회
  */
  useEffect(() => {
    fetchTravelList(selectedRegion, page, keyword);
  }, [page]);

  /*
   검색 버튼 클릭 시 실행
  */
  const handleSearch = () => {
    setPage(1);
    fetchTravelList(selectedRegion, 1, keyword);
  };

  const totalPages = Math.ceil(totalCount / size);

  const pageGroup = Math.floor((page - 1) / 10);
  const startPage = pageGroup * 10 + 1;
  const endPage = Math.min(startPage + 9, totalPages);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            여행지 검색
          </h1>
          <p className="text-muted-foreground">
            원하는 지역을 선택하거나 키워드 검색 가능
          </p>
        </div>

        {/* 필터 영역 */}
        <div className="flex items-center gap-3 mb-8 p-4 bg-card rounded-lg border border-border">

          <Search className="h-5 w-5 text-muted-foreground" />

          {/* 지역 선택 */}
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="지역 선택" />
            </SelectTrigger>
            <SelectContent>
              {REGIONS.map((region) => (
                <SelectItem key={region.value} value={region.value}>
                  {region.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 검색 입력창 */}
          <input
            placeholder="검색어 입력"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="border p-2 rounded"
          />

          {/* 검색 버튼 */}
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-black text-white rounded"
          >
            검색
          </button>

          <span className="text-sm text-muted-foreground ml-auto">
            {totalCount}개의 여행지
          </span>
        </div>

        {/* 리스트 영역 */}
        {travelList.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {travelList.map((destination) => (
                <DestinationCard
                  key={destination.content_id}
                  id={destination.content_id}
                  name={destination.title}
                  region={destination.area_code}
                  description={destination.addr1}
                  imageUrl={destination.first_image}
                  recommendYn={destination.recommend_yn}
                />
              ))}
            </div>

            {/* 페이지네이션 */}
            <div className="flex justify-center gap-2 mt-10 flex-wrap">

              <button
                disabled={startPage === 1}
                onClick={() => setPage(startPage - 10)}
                className="px-3 py-2 border rounded"
              >
                그이전
              </button>

              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-2 border rounded"
              >
                이전
              </button>

              {Array.from(
                { length: endPage - startPage + 1 },
                (_, i) => startPage + i
              ).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-2 border rounded ${
                    p === page ? "bg-black text-white" : ""
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-2 border rounded"
              >
                다음
              </button>

              <button
                disabled={endPage >= totalPages}
                onClick={() => setPage(startPage + 10)}
                className="px-3 py-2 border rounded"
              >
                다다음
              </button>

            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground">
              여행지가 없습니다
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
