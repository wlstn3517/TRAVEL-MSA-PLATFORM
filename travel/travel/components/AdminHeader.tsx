"use client"

import { useRouter } from "next/navigation"

/*
 관리자 페이지 공통 헤더 컴포넌트

 역할

 관리자 홈 이동 버튼
 로그아웃 버튼 제공
 모든 관리자 페이지 상단에 사용 가능
*/
export default function AdminHeader() {

  const router = useRouter()

  /*
   일반 사용자 메인 페이지 이동

   관리자에서 빠져나갈 때 사용
  */
  const goMain = () => {
    router.push("/")
  }

  /*
   로그아웃 처리

   jwt accessToken 삭제 후
   메인 페이지 이동
  */
  const logout = () => {

    // 토큰 삭제
    localStorage.removeItem("accessToken")

    // 메인 페이지 이동
    router.push("/")
  }

  return (
    <div className="flex justify-between items-center p-4 border-b bg-white">

      {/* 관리자 페이지 제목 */}
      <h1 className="text-lg font-bold">
        관리자 페이지
      </h1>

      {/* 우측 버튼 영역 */}
      <div className="flex gap-3">

        {/* 메인 이동 버튼 */}
        <button
          onClick={goMain}
          className="px-4 py-2 border rounded"
        >
          홈으로
        </button>

        {/* 로그아웃 버튼 */}
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          로그아웃
        </button>

      </div>

    </div>
  )
}