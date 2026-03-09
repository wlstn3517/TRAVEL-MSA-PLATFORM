"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

/*
 구글 간편 로그인 라이브러리
 GoogleOAuthProvider : 구글 클라이언트 ID를 앱 전체에 제공하는 컨텍스트
 GoogleLogin         : 구글 로그인 버튼 컴포넌트 (팝업 방식)
 onSuccess 콜백에서 credentialResponse.credential(ID 토큰)을 받아 백엔드로 전송
*/
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google"

export default function LoginPage() {

  // 아이디 비밀번호 상태 관리
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const router = useRouter()

  /*
   공통 로그인 성공 처리 함수
   일반 로그인 / 구글 로그인 모두 여기서 localStorage 저장 + 페이지 이동
  */
  const handleLoginSuccess = (data: { accessToken: string; role: string; username: string }) => {
    /*
     JWT 저장 (accessToken만 - refreshToken은 httpOnly 쿠키로 자동 저장됨)
    */
    localStorage.setItem("accessToken", data.accessToken)

    /*
     관리자 메뉴 표시 위해 role 저장
    */
    localStorage.setItem("role", data.role)

    /*
     사용자명 저장 (마이페이지 등에서 활용)
     구글 로그인 시에는 이메일이 username으로 저장됨
    */
    localStorage.setItem("username", data.username)

    // 로그인 성공 시 메인 이동
    router.push("/")
  }

  /*
   일반 로그인 처리 함수
   auth-service login API 호출
  */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            password,
          }),
          /*
           credentials: "include" 추가 이유
           프론트(localhost:3000)와 백엔드(localhost:8080)는 포트가 달라 cross-origin 요청
           브라우저는 cross-origin 응답의 Set-Cookie를 기본적으로 무시함
           credentials: "include" 를 달아야 브라우저가 Set-Cookie를 받아 저장함
           → 이게 없으면 서버가 refreshToken 쿠키를 응답해도 브라우저가 저장 안 함
          */
          credentials: "include",
        }
      )

      if (!res.ok) {
        alert("아이디 또는 비밀번호 확인")
        return
      }

      const data = await res.json()
      handleLoginSuccess(data)

    } catch (err) {
      console.error("로그인 오류:", err)
    }
  }

  /*
   구글 로그인 성공 처리 함수
   Google Identity Services가 반환한 credential(ID 토큰)을 백엔드로 전송

   흐름
   1. 구글 팝업에서 사용자가 계정 선택 → 구글이 ID 토큰 발급
   2. 이 함수가 ID 토큰을 받아 백엔드 /api/auth/google/login 으로 POST
   3. 백엔드에서 구글 tokeninfo API로 토큰 검증 + 사용자 자동 회원가입/로그인 처리
   4. 일반 로그인과 동일한 응답 구조(accessToken, role, username) 반환
   5. handleLoginSuccess로 localStorage 저장 + 메인 이동
  */
  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    const credential = credentialResponse.credential

    if (!credential) {
      alert("구글 로그인 정보를 받지 못했습니다")
      return
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ credential }),
          /*
           credentials: "include" 필수
           구글 로그인도 refreshToken을 httpOnly 쿠키로 받아야 함
           cross-origin 요청이므로 credentials 포함 필요
          */
          credentials: "include",
        }
      )

      if (!res.ok) {
        alert("구글 로그인 실패")
        return
      }

      const data = await res.json()
      handleLoginSuccess(data)

    } catch (err) {
      console.error("구글 로그인 오류:", err)
    }
  }

  return (
    /*
     GoogleOAuthProvider
     - clientId: Google Cloud Console에서 발급한 웹 애플리케이션 클라이언트 ID
     - NEXT_PUBLIC_ 환경변수로 브라우저에서 읽을 수 있게 설정 (.env.local)
     - 클라이언트 ID는 공개 값이므로 노출 OK (클라이언트 시크릿은 절대 여기 넣지 말 것)
     - GoogleLogin 컴포넌트를 사용하려면 부모에 Provider가 있어야 함
    */
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>

      <div className="min-h-screen flex items-center justify-center bg-gray-50">

        <form
          onSubmit={handleLogin}
          className="bg-white p-8 rounded-xl shadow-md w-full max-w-md space-y-6"
        >

          <h1 className="text-2xl font-bold text-center">
            로그인
          </h1>

          {/* 아이디 입력 */}
          <input
            type="text"
            placeholder="아이디"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border p-3 rounded-md"
          />

          {/* 비밀번호 입력 */}
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border p-3 rounded-md"
          />

          {/* 로그인 버튼 */}
          <button
            type="submit"
            className="w-full bg-black text-white p-3 rounded-md"
          >
            로그인
          </button>

          {/* 구분선 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">또는</span>
            </div>
          </div>

          {/*
           구글 간편 로그인 버튼
           GoogleLogin 컴포넌트가 구글 표준 디자인 버튼을 자동 렌더링

           onSuccess : 구글 계정 선택 성공 시 credentialResponse.credential(ID 토큰) 반환
           onError   : 팝업 닫기, 권한 거부 등 실패 시 호출

           useOneTap 옵션: 구글 One Tap 팝업 (자동 로그인 제안) - 필요 시 추가 가능
          */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                alert("구글 로그인 실패 또는 취소되었습니다")
              }}
              text="signin_with"
              locale="ko"
            />
          </div>

          {/* 회원가입 이동 링크 */}
          <div className="text-center text-sm">
            계정 없으신가요?{" "}
            <Link
              href="/signup"
              className="text-blue-600 hover:underline"
            >
              회원가입
            </Link>
          </div>

        </form>

      </div>

    </GoogleOAuthProvider>
  )
}
