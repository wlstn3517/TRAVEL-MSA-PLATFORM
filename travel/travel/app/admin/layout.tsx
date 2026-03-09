"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

/*
 lucide-react : 아이콘 라이브러리
 LayoutDashboard : 대시보드 메뉴 아이콘 + 사이드바 로고 아이콘
 Users           : 사용자 관리 메뉴 아이콘
 Ticket          : 쿠폰 관리 메뉴 아이콘
 Activity        : 배치 로그 메뉴 아이콘
 History         : 방문 이력 메뉴 아이콘
 Home            : 헤더 홈으로 버튼 아이콘
 LogOut          : 헤더 로그아웃 버튼 아이콘
*/
import { LayoutDashboard, Users, Ticket, Activity, History, Home, LogOut } from "lucide-react"

/*
 shadcn/ui 컴포넌트
 Button    : variant(outline, destructive 등) 와 size(sm, lg 등)를 props로 받는 버튼 컴포넌트
 Badge     : 작은 라벨 표시용 컴포넌트 (ADMIN 역할 표시에 사용)
 Separator : 가로/세로 구분선 컴포넌트
*/
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

/*
 cn : clsx + tailwind-merge 조합 유틸 함수
 여러 조건부 className을 하나의 문자열로 병합할 때 사용
 예) cn("기본클래스", 조건 && "조건클래스")
*/
import { cn } from "@/lib/utils"

/*
 관리자 공통 레이아웃

 역할 설명

 관리자 페이지 전체 공통 구조 담당

 1 로그인 토큰 확인
 2 관리자 권한 체크
 3 좌측 관리자 메뉴 제공 (다크 사이드바)
 4 상단 관리자 헤더 제공
 5 로그아웃 기능 제공
*/

/*
 navItems : 사이드바 네비게이션 메뉴 목록
 href  : 이동할 경로 (usePathname과 비교해 현재 페이지 판별)
 label : 메뉴에 표시할 한글 이름
 icon  : 메뉴 좌측에 표시할 lucide 아이콘 컴포넌트
*/
const navItems = [
  { href: "/admin",             label: "대시보드",    icon: LayoutDashboard },
  { href: "/admin/users",       label: "사용자 관리", icon: Users },
  { href: "/admin/coupons",     label: "쿠폰 관리",   icon: Ticket },
  { href: "/admin/batch-logs",  label: "배치 로그",   icon: Activity },
  { href: "/admin/history",     label: "방문 이력",   icon: History },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const router = useRouter()

  /*
   usePathname : Next.js App Router에서 현재 URL 경로를 읽는 훅
   예) /admin/users 페이지에 있으면 "/admin/users" 반환
   navItems 순회 시 href와 비교해 현재 메뉴 활성화 여부(isActive) 판별에 사용
  */
  const pathname = usePathname()

  /*
   관리자 로그인 상태 체크

   accessToken 존재 여부 확인
   role 값이 ADMIN 인지 확인

   관리자 아니면 메인 페이지 이동
  */
  useEffect(() => {

    // 브라우저 환경 체크
    // 서버 렌더링 시 localStorage 접근 오류 방지
    if (typeof window === "undefined") return

    const token = localStorage.getItem("accessToken")
    const role  = localStorage.getItem("role")

    if (!token || role !== "ADMIN") {
      alert("관리자만 접근 가능")
      router.push("/")
    }

  }, [router])

  /*
   로그아웃 처리 함수

   jwt 토큰 제거 후
   메인 페이지 이동
  */
  const logout = () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("role")
    router.push("/")
  }

  return (
    /*
     전체 레이아웃 : 가로 flex
     좌측 aside(사이드바) + 우측 main(헤더 + 콘텐츠) 구조
     min-h-screen : 화면 높이 전체를 채움
     bg-gray-50   : 콘텐츠 영역 배경색 (연한 회색)
    */
    <div className="flex min-h-screen bg-gray-50">

      {/* ── 좌측 다크 사이드바 ── */}
      {/*
        w-64       : 사이드바 고정 너비 256px
        bg-slate-900 : 진한 남색 배경 (다크 테마)
        flex flex-col : 세로 방향 flex (로고 / 메뉴 / 버전 순서로 쌓임)
        shrink-0   : 화면이 좁아져도 사이드바 너비 줄어들지 않음
      */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">

        {/* 로고 / 브랜드 영역 */}
        <div className="p-5">
          <div className="flex items-center gap-3">
            {/*
              사이드바 상단 아이콘 박스
              bg-blue-600  : 파란 배경
              rounded-lg   : 모서리 둥글게
              shrink-0     : 아이콘 박스 크기 고정 (텍스트가 길어도 찌그러지지 않음)
            */}
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold leading-none">Travel Admin</p>
              {/* text-slate-400 : 부제목은 연한 회색으로 시각적 계층 구분 */}
              <p className="text-xs text-slate-400 mt-0.5">관리자 콘솔</p>
            </div>
          </div>
        </div>

        {/*
          Separator : 가로 구분선
          bg-slate-700 : 다크 배경에 어울리는 어두운 구분선 색상
        */}
        <Separator className="bg-slate-700" />

        {/* ── 네비게이션 링크 영역 ── */}
        {/*
          flex-1 : 남은 세로 공간을 모두 차지 (버전 표시를 하단에 고정시키는 효과)
          space-y-1 : 메뉴 항목 간격 4px
        */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {

            /*
             isActive : 현재 URL과 메뉴 href가 일치하면 true
             usePathname()으로 읽은 현재 경로와 비교
             활성 메뉴는 파란 배경(bg-blue-600)으로 강조 표시
            */
            const isActive = pathname === href

            return (
              <Link
                key={href}
                href={href}
                /*
                 cn() : 기본 클래스에 조건부 클래스를 병합
                 isActive가 true  → bg-blue-600 text-white (파란 배경 활성 스타일)
                 isActive가 false → text-slate-300 hover:bg-slate-800 (기본 + 호버 스타일)
                */
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                {/*
                  Icon : navItems에서 구조 분해한 아이콘 컴포넌트
                  icon: Icon 으로 받아서 대문자 시작 변수로 JSX에서 사용 가능
                  shrink-0 : 텍스트가 길어도 아이콘 크기 고정
                */}
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        <Separator className="bg-slate-700" />

        {/* 사이드바 하단 버전 표시 */}
        <div className="p-4">
          <p className="text-xs text-slate-500 text-center">v1.0.0</p>
        </div>

      </aside>

      {/* ── 관리자 메인 콘텐츠 영역 ── */}
      {/*
        flex-1  : 사이드바 제외한 나머지 가로 공간 전부 차지
        min-w-0 : flex 자식 요소의 내용이 넘칠 때 강제 축소 허용 (overflow 방지)
      */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* ── 상단 헤더 ── */}
        {/*
          shrink-0 : 콘텐츠가 많아도 헤더 높이 고정
          border-b : 하단 구분선으로 헤더와 콘텐츠 영역 분리
        */}
        <header className="bg-white border-b px-6 py-3 flex justify-between items-center shrink-0">

          <h1 className="text-base font-semibold text-gray-800">
            관리자 페이지
          </h1>

          <div className="flex items-center gap-3">

            {/*
              Badge : shadcn/ui 뱃지 컴포넌트
              현재 로그인한 사용자의 역할(ADMIN)을 시각적으로 표시
              bg-blue-50 + text-blue-700 + border-blue-200 : 파란 계열 커스텀 색상 지정
              hover:bg-blue-50 : 마우스 호버 시 배경 변하지 않도록 고정
            */}
            <Badge className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-50">
              ADMIN
            </Badge>

            {/*
              Button : shadcn/ui 버튼 컴포넌트
              variant="outline" : 테두리만 있는 스타일
              size="sm"         : 작은 크기
            */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/")}
            >
              <Home className="w-3.5 h-3.5" />
              홈으로
            </Button>

            {/*
              variant="destructive" : 빨간 배경의 위험 동작 스타일 (로그아웃에 적합)
            */}
            <Button
              variant="destructive"
              size="sm"
              onClick={logout}
            >
              <LogOut className="w-3.5 h-3.5" />
              로그아웃
            </Button>

          </div>
        </header>

        {/* 실제 관리자 페이지 콘텐츠 (각 admin 하위 page.tsx가 렌더링되는 위치) */}
        <div className="flex-1 p-6">
          {children}
        </div>

      </main>

    </div>
  )
}
