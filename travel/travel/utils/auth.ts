/*
 로그인 상태 관리 유틸

 localStorage의 accessToken 기준으로 로그인 여부 판단
 logout은 서버에 refresh token 무효화 요청 후 localStorage 정리
*/

// localStorage에서 access token 꺼내기
export function getToken() {
  return localStorage.getItem("accessToken")
}

// access token 존재 여부로 로그인 상태 판단
export function isLoggedIn() {
  return !!getToken()
}

/*
 로그아웃 처리

 1. 서버 /api/auth/logout 호출
    → DB에서 refresh token 삭제 (탈취된 토큰도 무효화됨)
    → 브라우저 httpOnly 쿠키도 만료 처리

 2. localStorage 정리
    → accessToken, role, username 삭제

 async 함수이므로 호출 시 await 필요
 서버 호출 실패해도 클라이언트 로그아웃은 항상 진행
*/
export async function logout() {

  // 서버에 refresh token 무효화 요청
  // credentials: 'include' → httpOnly 쿠키(refreshToken)를 자동으로 같이 전송
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    })
  } catch {
    // 서버가 응답 없어도 클라이언트 로그아웃은 진행
    console.warn("서버 로그아웃 요청 실패 - 클라이언트 로그아웃은 계속 진행")
  }

  // localStorage 정리
  localStorage.removeItem("accessToken")
  localStorage.removeItem("role")
  localStorage.removeItem("username")
}
