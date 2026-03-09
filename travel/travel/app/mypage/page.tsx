"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { fetchWithAuth } from "@/utils/fetchWithAuth"
import CouponCard from "@/components/coupon-card"
import Link from "next/link"
import {
  User, Mail, Phone, MapPin, Calendar,
  Clock, Ticket, History, ChevronRight,
  PencilLine, X, Check
} from "lucide-react"

type User = {
  username: string
  name: string
  role: string
  email: string
  phone: string
  postcode: string
  roadAddress: string
  jibunAddress: string
  detailAddress: string
  createdAt: string
}

export default function MyPage() {

  const router = useRouter()

  const [tab, setTab] = useState("profile")
  const [editMode, setEditMode] = useState(false)

  const [user, setUser] = useState<User | null>(null)
  const [form, setForm] = useState<any>({})
  const [coupons, setCoupons] = useState<any[]>([])

  // 최근 본 여행지 이력 (최대 10건)
  const [viewHistory, setViewHistory] = useState<any[]>([])

  useEffect(() => {
    fetchUser()
    if (tab === "coupon") fetchCoupons()
    if (tab === "history") fetchViewHistory()
  }, [])

  // 탭 전환 시 해당 데이터 조회
  useEffect(() => {
    if (tab === "coupon") fetchCoupons()
    if (tab === "history") fetchViewHistory()
  }, [tab])

  /*
   사용자 정보 조회
   fetchWithAuth: 401 시 refresh token으로 자동 갱신 후 재시도
   갱신 실패 시 /login 으로 자동 이동
  */
  const fetchUser = async () => {
    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/mypage`
      )
      if (!res.ok) { router.push("/login"); return }
      const data = await res.json()
      setUser(data)
      setForm(data)
    } catch { router.push("/login") }
  }

  /*
   쿠폰 이력 조회
   fetchWithAuth: 토큰 만료 시 자동 갱신
  */
  const fetchCoupons = async () => {
    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/travel/coupon/my`
      )
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data)) setCoupons(data)
      else if (Array.isArray(data.data)) setCoupons(data.data)
      else setCoupons([])
    } catch { setCoupons([]) }
  }

  /*
   내 방문 이력 조회
   JWT 토큰만 보내면 서버에서 본인 username으로 조회
   fetchWithAuth: 토큰 만료 시 자동 갱신
  */
  const fetchViewHistory = async () => {
    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/travel/history/me`
      )
      const data = await res.json()
      setViewHistory(Array.isArray(data) ? data : [])
    } catch { setViewHistory([]) }
  }

  /*
   방문 일시 포맷 변환
   "2024-01-15T10:30:00" → "01-15 10:30"
  */
  const formatViewedAt = (dateStr: string) => {
    if (!dateStr) return ""
    return dateStr.replace("T", " ").slice(5, 16)
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length < 4) return numbers
    if (numbers.length < 7) return numbers.replace(/(\d{3})(\d+)/, "$1-$2")
    if (numbers.length < 11) return numbers.replace(/(\d{3})(\d{3})(\d+)/, "$1-$2-$3")
    return numbers.replace(/(\d{3})(\d{4})(\d+)/, "$1-$2-$3")
  }

  const handleChange = (e: any) => {
    const { name, value } = e.target
    if (name === "phone") {
      setForm({ ...form, phone: formatPhone(value) })
      return
    }
    setForm({ ...form, [name]: value })
  }

  const openPostcode = () => {
    const w = window as any
    if (!w.daum) { alert("주소 검색 스크립트 로딩 안됨"); return }
    new w.daum.Postcode({
      oncomplete: function (data: any) {
        setForm((prev: any) => ({
          ...prev,
          postcode: data.zonecode,
          roadAddress: data.roadAddress,
          jibunAddress: data.jibunAddress,
        }))
      }
    }).open()
  }

  /*
   정보 수정 저장
   fetchWithAuth: 토큰 만료 시 자동 갱신
  */
  const handleUpdate = async () => {
    try {
      await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/mypage`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      )
      alert("정보 수정 완료")
      setEditMode(false)
      fetchUser()
    } catch {}
  }

  // 탭 목록 (아이콘 포함)
  const tabs = [
    { key: "profile", label: "나의 정보",      icon: User    },
    { key: "coupon",  label: "쿠폰 이력",      icon: Ticket  },
    { key: "history", label: "최근 본 여행지", icon: History },
  ]

  return (
    <div className="min-h-screen bg-slate-50">

      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">

        {/* 프로필 헤더 카드 */}
        {user && (
          <div className="relative bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl overflow-hidden mb-6 shadow-lg">

            {/* 배경 장식 원 */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-20 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />

            <div className="relative flex items-center gap-6 p-8">

              {/* 아바타: 이름 첫 글자 */}
              <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 text-white text-3xl font-bold shadow-inner">
                {user.name?.charAt(0) ?? "?"}
              </div>

              <div className="flex-1 min-w-0">

                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl font-bold text-white">
                    {user.name}
                  </h2>
                  {/* 권한 배지 */}
                  <span className={`px-3 py-0.5 rounded-full text-xs font-semibold ${
                    user.role === "ADMIN"
                      ? "bg-orange-400/30 text-orange-200 border border-orange-400/40"
                      : "bg-emerald-400/30 text-emerald-200 border border-emerald-400/40"
                  }`}>
                    {user.role}
                  </span>
                </div>

                <p className="text-slate-400 text-sm mt-1">
                  @{user.username}
                </p>

                {/* 가입일 */}
                <p className="text-slate-500 text-xs mt-2 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  가입일 {user.createdAt?.slice(0, 10) ?? ""}
                </p>

              </div>

            </div>
          </div>
        )}

        {/* 탭 */}
        <div className="flex gap-1 bg-white rounded-xl p-1.5 shadow-sm mb-6 border border-slate-100">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === key
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 카드 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">

          {/* ── 나의 정보 탭 ── */}
          {tab === "profile" && user && (
            <div className="p-6 md:p-8">

              {!editMode ? (
                <>
                  {/* 정보 목록 */}
                  <div className="space-y-5">

                    <InfoRow icon={Mail} label="이메일" value={user.email} />
                    <InfoRow icon={Phone} label="전화번호" value={user.phone} />

                    <div className="flex gap-3 py-4 border-b border-slate-100">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">주소</p>
                        <p className="text-sm font-medium text-slate-800">
                          {[user.postcode, user.roadAddress, user.detailAddress]
                            .filter(Boolean)
                            .join(" ")}
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* 수정 버튼 */}
                  <button
                    onClick={() => setEditMode(true)}
                    className="mt-8 flex items-center gap-2 bg-slate-800 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors"
                  >
                    <PencilLine className="w-4 h-4" />
                    정보 수정
                  </button>
                </>
              ) : (
                /* 수정 폼 */
                <div className="space-y-4">

                  <p className="text-sm font-semibold text-slate-700 mb-6">
                    정보 수정
                  </p>

                  <FormField label="이름">
                    <input name="name" value={form.name || ""} onChange={handleChange}
                      className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
                  </FormField>

                  <FormField label="이메일">
                    <input name="email" value={form.email || ""} onChange={handleChange}
                      className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
                  </FormField>

                  <FormField label="전화번호">
                    <input name="phone" value={form.phone || ""} onChange={handleChange}
                      className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
                  </FormField>

                  <FormField label="우편번호">
                    <div className="flex gap-2">
                      <input name="postcode" value={form.postcode || ""} readOnly
                        className="flex-1 border border-slate-200 rounded-lg p-3 text-sm bg-slate-50" />
                      <button type="button" onClick={openPostcode}
                        className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-800 hover:text-white transition-colors whitespace-nowrap">
                        주소 검색
                      </button>
                    </div>
                  </FormField>

                  <FormField label="도로명 주소">
                    <input name="roadAddress" value={form.roadAddress || ""} readOnly
                      className="w-full border border-slate-200 rounded-lg p-3 text-sm bg-slate-50" />
                  </FormField>

                  <FormField label="지번 주소">
                    <input name="jibunAddress" value={form.jibunAddress || ""} readOnly
                      className="w-full border border-slate-200 rounded-lg p-3 text-sm bg-slate-50" />
                  </FormField>

                  <FormField label="상세 주소">
                    <input name="detailAddress" value={form.detailAddress || ""} onChange={handleChange}
                      className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
                  </FormField>

                  {/* 저장 / 취소 버튼 */}
                  <div className="flex gap-3 pt-4">
                    <button onClick={handleUpdate}
                      className="flex items-center gap-2 bg-slate-800 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors">
                      <Check className="w-4 h-4" />
                      저장
                    </button>
                    <button onClick={() => setEditMode(false)}
                      className="flex items-center gap-2 border border-slate-200 text-slate-600 px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
                      <X className="w-4 h-4" />
                      취소
                    </button>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* ── 쿠폰 이력 탭 ── */}
          {tab === "coupon" && (
            <div className="p-6 md:p-8">
              {coupons.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <Ticket className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">보유 쿠폰이 없습니다</p>
                  <p className="text-xs mt-1">여행지 상세 페이지에서 쿠폰을 받아보세요</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {coupons.map((coupon, idx) => (
                    <CouponCard
                      key={idx}
                      couponName={coupon.couponName}
                      discountType={coupon.discountType}
                      discountValue={coupon.discountValue}
                      travelId={coupon.travelId}
                      usedYn={coupon.useYn}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── 최근 본 여행지 탭 ── */}
          {tab === "history" && (
            <div className="p-6 md:p-8">
              {viewHistory.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">최근 본 여행지가 없습니다</p>
                  <p className="text-xs mt-1">여행지를 클릭하면 여기에 기록됩니다</p>
                  <Link href="/search"
                    className="inline-flex items-center gap-1 mt-4 text-xs text-slate-500 hover:text-slate-800 underline underline-offset-2">
                    여행지 둘러보기
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {viewHistory.map((item, i) => (
                    /*
                     카드 클릭 시 해당 여행지 상세 페이지 이동
                    */
                    <Link
                      key={item.contentId}
                      href={`/destination/${item.contentId}`}
                      className="group block rounded-xl overflow-hidden border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all bg-white"
                    >
                      {/* 썸네일
                          crossOrigin="anonymous" 제거 - 외부 이미지 CORS 에러 원인이었음
                          단순 표시 목적이면 해당 속성 없이 src만으로 충분 */}
                      <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                        {item.firstImage ? (
                          <img
                            src={item.firstImage}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300 text-2xl font-bold">
                            {i + 1}
                          </div>
                        )}
                      </div>

                      {/* 여행지 정보 */}
                      <div className="p-2.5">
                        <p className="text-xs font-semibold text-slate-800 line-clamp-1">
                          {item.title || "이름 없음"}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-0.5 line-clamp-1">
                          <MapPin className="w-2.5 h-2.5 shrink-0" />
                          {item.addr1 || "-"}
                        </p>
                        <p className="text-xs text-slate-300 mt-1 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5 shrink-0" />
                          {formatViewedAt(item.viewedAt)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </main>
    </div>
  )
}

/* ── 공통 컴포넌트 ── */

// 정보 표시 행 (아이콘 + 라벨 + 값)
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any
  label: string
  value: string
}) {
  return (
    <div className="flex gap-3 py-4 border-b border-slate-100">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
      <div>
        <p className="text-xs text-slate-400 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-slate-800">{value || "-"}</p>
      </div>
    </div>
  )
}

// 수정 폼 필드 래퍼 (라벨 + 인풋)
function FormField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}
