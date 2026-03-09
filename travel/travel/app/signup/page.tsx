"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function SignupPage() {

  // 페이지 이동용 router
  // 회원가입 성공 후 로그인 페이지 이동에 사용
  const router = useRouter()

  // 회원가입 입력 상태 관리
  // 모든 input 값 하나의 객체로 관리
  const [form, setForm] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    phone: "",
    postcode: "",
    roadAddress: "",
    jibunAddress: "",
    detailAddress: "",
  })

   // 입력값 변경
// 전화번호 자동 포맷 함수
// 숫자만 남기고 하이픈 자동 추가
const formatPhone = (value: string) => {

  const numbers = value.replace(/\D/g, "")

  if (numbers.length < 4) return numbers
  if (numbers.length < 7) {
    return numbers.replace(/(\d{3})(\d+)/, "$1-$2")
  }
  if (numbers.length < 11) {
    return numbers.replace(/(\d{3})(\d{3})(\d+)/, "$1-$2-$3")
  }

  return numbers.replace(/(\d{3})(\d{4})(\d+)/, "$1-$2-$3")
}


// 기존 handleChange 수정 버전 
const handleChange = (e: any) => {

  const { name, value } = e.target

  if (name === "phone") {
    setForm({
      ...form,
      phone: formatPhone(value),
    })
    return
  }

  setForm({
    ...form,
    [name]: value,
  })
}
  // 카카오 주소 검색 팝업 실행
  const handleAddressSearch = () => {

    // 타입 문제 방지용 window 캐스팅
    const w = window as any

    // 주소 api 로딩 여부 확인
    if (!w.daum) {
      alert("주소 검색 스크립트 로딩 안됨")
      return
    }

    // 카카오 주소 검색 팝업 실행
    new w.daum.Postcode({
      oncomplete: function (data: any) {

        // 주소 선택 시 자동 form 세팅
        setForm(prev => ({
          ...prev,
          postcode: data.zonecode,
          roadAddress: data.roadAddress,
          jibunAddress: data.jibunAddress,
        }))

      },
    }).open()
  }

  // 회원가입 제출 처리
  const handleSignup = async (e: any) => {
    e.preventDefault()

    // 필수값 최소 체크
    if (!form.username || !form.password) {
      alert("아이디 비밀번호 입력 필요")
      return
    }

    try {

      // gateway 주소 환경변수에서 가져오기
      const baseUrl = process.env.NEXT_PUBLIC_API_URL

      // env 설정 안된 경우 방지
      if (!baseUrl) {
        alert("API URL 설정 안됨")
        return
      }

      // 회원가입 API 호출
      const res = await fetch(
        `${baseUrl}/api/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      )

      // 서버 응답 실패 시 처리
      if (!res.ok) {
        alert("회원가입 실패")
        return
      }

      // 성공 시 안내
      alert("회원가입 성공")

      // 로그인 페이지 이동
      router.push("/login")

    } catch (err) {

      // 네트워크 오류 등 예외 처리
      console.error("회원가입 오류", err)
      alert("서버 오류 발생")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">

      {/* 회원가입 form */}
      <form
        onSubmit={handleSignup}
        className="bg-white p-8 rounded-xl shadow-md w-full max-w-lg space-y-4"
      >

        <h1 className="text-2xl font-bold text-center">
          회원가입
        </h1>

        {/* 아이디 입력 */}
        <input
          name="username"
          placeholder="아이디"
          onChange={handleChange}
          className="w-full border p-3 rounded-md"
        />

        {/* 비밀번호 입력 */}
        <input
          type="password"
          name="password"
          placeholder="비밀번호"
          onChange={handleChange}
          className="w-full border p-3 rounded-md"
        />

        {/* 이름 입력 */}
        <input
          name="name"
          placeholder="이름"
          onChange={handleChange}
          className="w-full border p-3 rounded-md"
        />

        {/* 이메일 입력 */}
        <input
          name="email"
          placeholder="이메일"
          onChange={handleChange}
          className="w-full border p-3 rounded-md"
        />

        {/* 전화번호 입력 */}
        <input
          name="phone"
          placeholder="전화번호"
          onChange={handleChange}
          className="w-full border p-3 rounded-md"
        />

        {/* 카카오 주소 검색 버튼 */}
        <button
          type="button"
          onClick={handleAddressSearch}
          className="w-full bg-black text-white p-3 rounded-md"
        >
          주소 검색
        </button>

        {/* 주소 자동 입력 영역 */}
        <input
          name="postcode"
          placeholder="우편번호"
          value={form.postcode}
          readOnly
          className="w-full border p-3 rounded-md bg-gray-100"
        />

        <input
          name="roadAddress"
          placeholder="도로명 주소"
          value={form.roadAddress}
          readOnly
          className="w-full border p-3 rounded-md bg-gray-100"
        />

        <input
          name="jibunAddress"
          placeholder="지번 주소"
          value={form.jibunAddress}
          readOnly
          className="w-full border p-3 rounded-md bg-gray-100"
        />

        {/* 상세 주소 입력 */}
        <input
          name="detailAddress"
          placeholder="상세 주소"
          onChange={handleChange}
          className="w-full border p-3 rounded-md"
        />

        {/* 회원가입 버튼 */}
        <button
          type="submit"
          className="w-full bg-black text-white p-3 rounded-md"
        >
          회원가입
        </button>

      </form>
    </div>
  )
}
