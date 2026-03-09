/*
 보호 페이지 체크 유틸
 토큰 없으면 로그인 이동
*/

export function requireLogin(router: any) {

  const token = localStorage.getItem("accessToken")

  if (!token) {
    alert("로그인 필요")
    router.push("/login")
  }
}
