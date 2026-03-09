"use client"

import Link from "next/link"
import { Compass } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { isLoggedIn, logout } from "@/utils/auth"

export function Header() {

  const router = useRouter()

  // 로그인 상태 관리 state
  const [loggedIn, setLoggedIn] = useState(false)

  // 관리자 권한 여부 state 추가
  const [isAdmin, setIsAdmin] = useState(false)

  /*
   컴포넌트 최초 렌더 시 로그인 여부 확인
   localStorage accessToken 기반
  */
  useEffect(() => {
    setLoggedIn(isLoggedIn())

    // 관리자 권한 확인 추가
    const role = localStorage.getItem("role")
    if (role === "ADMIN") {
      setIsAdmin(true)
    }

  }, [])

  /*
   로그아웃 버튼 클릭 시 실행

   async 이유
   logout()이 서버에 refresh token 무효화 요청을 보내는 비동기 함수
   await 없이 호출하면 서버 요청 완료 전에 화면이 전환될 수 있음
  */
  const handleLogout = async () => {
    // 서버 refresh token 삭제 + localStorage 정리 (utils/auth.ts logout 참고)
    await logout()
    setLoggedIn(false)
    setIsAdmin(false)
    // 로그아웃 후 메인으로 강제 이동
    router.push("/")
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex items-center justify-between h-16">

          {/* 로고 영역 */}
          <Link href="/" className="flex items-center gap-2">
            <Compass className="h-6 w-6 text-foreground" />
            <span className="text-xl font-bold text-foreground">
              Travel Recommender
            </span>
          </Link>

          {/* 상단 메뉴 */}
          <nav className="flex items-center gap-6">

            {/* 추천 메인 */}
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              추천받기
            </Link>

            {/* 여행지 검색 */}
            <Link
              href="/search"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              여행지 검색
            </Link>

            {/* 관리자 메뉴 추가 */}
            {loggedIn && isAdmin && (
              <Link
                href="/admin"
                className="text-sm font-medium text-orange-600"
              >
                관리자 페이지
              </Link>
            )}

            {/* 로그인 상태일 때만 마이페이지 표시 */}
            {loggedIn && (
              <Link
                href="/mypage"
                className="text-sm font-medium text-green-600"
              >
                마이페이지
              </Link>
            )}

            {/* 로그인 상태 표시 */}
            {loggedIn ? (
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-red-500"
              >
                로그아웃
              </button>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium text-blue-500"
              >
                로그인
              </Link>
            )}

          </nav>

        </div>
      </div>
    </header>
  )
}