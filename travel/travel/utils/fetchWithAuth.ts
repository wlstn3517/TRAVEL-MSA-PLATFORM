/*
 인증이 필요한 API 요청 전용 fetch 래퍼

 역할
 1. Authorization 헤더에 Bearer access token 자동 첨부
 2. 응답이 401(인증 만료)이면 refresh token으로 새 access token 자동 발급 시도
 3. 갱신 성공 시 원래 요청 재시도 (사용자는 만료를 모름)
 4. 갱신 실패 시 localStorage 정리 후 로그인 페이지로 이동

 사용법
 기존:   fetch(url, { method: "GET", headers: { Authorization: `Bearer ${token}` } })
 변경 후: fetchWithAuth(url, { method: "GET" })
         → 토큰 자동 첨부 + 만료 시 자동 갱신
*/

import { getToken } from "./auth"

/*
 메인 fetch 래퍼 함수
 인증 헤더 자동 첨부 + 401 시 자동 갱신
*/
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {

  // 현재 저장된 access token 가져오기
  const token = getToken()

  // Authorization 헤더 조립 (기존 헤더 유지 + 토큰 추가)
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  // 첫 번째 요청 시도
  const res = await fetch(url, {
    ...options,
    headers,
    // credentials: include → httpOnly 쿠키(refreshToken)를 요청에 자동 첨부
    // refresh 엔드포인트 호출 시 필요
    credentials: "include",
  })

  // 401이 아니면 그대로 반환 (정상 or 다른 에러)
  if (res.status !== 401) {
    return res
  }

  // 401 수신 → refresh token으로 access token 갱신 시도
  const refreshed = await tryRefreshAccessToken()

  if (!refreshed) {
    // 갱신 실패 → 로그인 상태 정리 후 로그인 페이지 이동
    localStorage.removeItem("accessToken")
    localStorage.removeItem("role")
    localStorage.removeItem("username")
    window.location.href = "/login"
    return res
  }

  // 갱신 성공 → 새 토큰으로 원래 요청 재시도
  const newToken = getToken()
  const retryHeaders: Record<string, string> = {
    ...(options.headers as Record<string, string>),
    ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
  }

  return fetch(url, {
    ...options,
    headers: retryHeaders,
    credentials: "include",
  })
}

/*
 refresh token으로 access token 갱신 시도

 POST /api/auth/refresh 호출
 → credentials: include 로 httpOnly 쿠키(refreshToken) 자동 전송
 → 서버가 refresh token 검증 후 새 access token 반환
 → 성공 시 localStorage 갱신 후 true 반환
 → 실패(토큰 만료, 없음 등) 시 false 반환
*/
async function tryRefreshAccessToken(): Promise<boolean> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
      {
        method: "POST",
        // httpOnly 쿠키(refreshToken)를 서버에 자동 전송
        credentials: "include",
      }
    )

    if (!res.ok) {
      // 서버가 401 또는 다른 에러 반환 → 갱신 불가
      return false
    }

    const data = await res.json()

    // 새 access token을 localStorage에 저장
    localStorage.setItem("accessToken", data.accessToken)

    return true

  } catch {
    // 네트워크 오류 등 → 갱신 실패
    return false
  }
}
