"use client"

import { useState } from "react"
import { Search, MapPin, Clock, User } from "lucide-react"

/*
 fetchWithAuth 공통 유틸 import
 - 기존: localStorage 직접 읽어 토큰 수동 세팅
 - 변경: fetchWithAuth가 자동으로 토큰 포함 + 401 시 refresh token 갱신 후 재시도
 - 효과: 관리자 세션 만료 시에도 이력 조회 자동 갱신
*/
import { fetchWithAuth } from "@/utils/fetchWithAuth"

/*
 방문한 여행지 이력 타입
 travel-service user_view_history 테이블 기준
*/
interface ViewHistory {
  contentId: string
  title: string
  firstImage: string
  addr1: string
  viewedAt: string
}

export default function AdminHistoryPage() {

  // 검색창에 입력한 username
  const [searchInput, setSearchInput] = useState("")

  // 현재 조회 중인 username (검색 버튼 눌렀을 때 확정)
  const [queriedUsername, setQueriedUsername] = useState("")

  // 조회 결과 목록
  const [history, setHistory] = useState<ViewHistory[]>([])

  // 로딩 / 검색 완료 여부
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  /*
   username으로 방문 이력 조회
   GET /api/admin/history?username=xxx
  */
  const fetchHistory = async () => {
    const username = searchInput.trim()
    if (!username) return

    setLoading(true)
    setSearched(false)

    try {
      /*
       fetchWithAuth로 교체한 이유
       - 기존: localStorage.getItem("accessToken")으로 직접 토큰 읽어 헤더에 수동 설정
       - 문제: 토큰 만료 시 401 응답 받아도 자동 갱신 없이 조회 실패
       - 변경: fetchWithAuth가 자동으로 토큰 포함 + 401 시 refresh 후 재시도
       - 효과: 관리자가 오래 있다가 검색해도 자동 갱신 후 정상 조회
      */
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/history?username=${encodeURIComponent(username)}`
      )

      if (!res.ok) {
        console.error("이력 조회 실패:", res.status)
        setHistory([])
      } else {
        const data = await res.json()
        setHistory(Array.isArray(data) ? data : [])
        setQueriedUsername(username)
      }
    } catch (err) {
      console.error("이력 조회 오류:", err)
      setHistory([])
    } finally {
      setLoading(false)
      setSearched(true)
    }
  }

  /*
   Enter 키 검색 지원
  */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") fetchHistory()
  }

  /*
   viewedAt 포맷 변환
   "2024-01-15T10:30:00" → "2024-01-15 10:30"
  */
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-"
    return dateStr.replace("T", " ").slice(0, 16)
  }

  return (
    <div className="p-8">

      <h1 className="text-2xl font-bold mb-2">방문 이력 조회</h1>
      <p className="text-sm text-gray-500 mb-6">
        사용자 ID로 검색하면 최근 본 여행지 최대 10건을 확인할 수 있습니다
      </p>

      {/* 검색 영역 */}
      <div className="flex gap-2 mb-8">
        <div className="relative flex-1 max-w-sm">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="사용자 ID 입력"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          <Search className="w-4 h-4" />
          {loading ? "조회 중..." : "검색"}
        </button>
      </div>

      {/* 결과 영역 */}
      {searched && (
        <>
          {/* 결과 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-700">
              <span className="text-blue-600">{queriedUsername}</span> 님의 최근 방문 이력
            </p>
            <span className="text-xs text-gray-400">
              총 {history.length}건 (최대 10건)
            </span>
          </div>

          {history.length === 0 ? (
            // 이력 없을 때
            <div className="text-center py-16 text-gray-400">
              <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">방문 이력이 없거나 존재하지 않는 사용자입니다</p>
            </div>
          ) : (
            // 이력 카드 목록
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {history.map((item, i) => (
                <div
                  key={item.contentId}
                  className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* 여행지 썸네일
                      crossOrigin="anonymous" 제거 - 외부 이미지 CORS 에러 원인이었음
                      단순 표시 목적이면 해당 속성 없이 src만으로 충분 */}
                  <div className="aspect-[16/10] bg-gray-100 overflow-hidden">
                    {item.firstImage ? (
                      <img
                        src={item.firstImage}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      // 이미지 없으면 순서 번호 표시
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl font-bold">
                        {i + 1}
                      </div>
                    )}
                  </div>

                  {/* 여행지 정보 */}
                  <div className="p-3">
                    <p className="font-semibold text-sm text-gray-800 line-clamp-1">
                      {item.title || "이름 없음"}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {item.addr1 || "-"}
                    </p>
                    {/* 방문 시각 */}
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3 shrink-0" />
                      {formatDate(item.viewedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

    </div>
  )
}
