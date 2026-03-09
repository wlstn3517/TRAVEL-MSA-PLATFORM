"use client"

import { useEffect, useRef, useState } from "react"

/*
 fetchWithAuth 공통 유틸
 401 발생 시 refresh token 자동 갱신 후 재시도
*/
import { fetchWithAuth } from "@/utils/fetchWithAuth"

/*
 Download 아이콘 - 엑셀 다운로드 버튼용
 Loader2   아이콘 - 처리 중 스피너
 Plus      아이콘 - 쿠폰 등록 버튼용
*/
import { Download, Loader2, Plus } from "lucide-react"

/*
 쿠폰 발급 이력 타입
 travel_coupon + coupon_master JOIN 결과
*/
interface IssuedCoupon {
  username:      string
  couponName:    string
  discountType:  string
  discountValue: number
  travelId:      string
  issuedAt:      string
  usedYn:        number
}

/*
 쿠폰 정책(마스터) 타입
 coupon_master 테이블 구조
*/
interface CouponMaster {
  couponId:      number
  couponCode:    string
  couponName:    string
  discountType:  string
  discountValue: number
  travelId:      string
}

/*
 엑셀 내보내기 잡 상태 타입
*/
interface ExportJobStatus {
  id:        number
  jobType:   string
  status:    string   // PENDING / PROCESSING / COMPLETED / FAILED
  fileName?: string
}

/*
 쿠폰 마스터 등록 폼 입력 타입
 coupon_master 테이블 컬럼 기준
 coupon_code 는 서버에서 자동 생성이므로 폼에 없음
*/
interface CouponCreateForm {
  couponName:    string   // 쿠폰 이름
  discountType:  string   // 할인 유형: percent / amount
  discountValue: string   // 할인 값 (숫자이지만 input 처리를 위해 string)
  travelId:      string   // 연결 여행지 ID (선택)
}

export default function AdminCouponsPage() {

  // 현재 선택된 탭 (issued = 발급 이력 / masters = 쿠폰 정책)
  const [tab, setTab] = useState<"issued" | "masters">("issued")

  // 발급 이력 목록
  const [issuedCoupons,  setIssuedCoupons]  = useState<IssuedCoupon[]>([])

  // 쿠폰 정책 목록
  const [couponMasters, setCouponMasters] = useState<CouponMaster[]>([])

  // ──────────────────────────────────────────────
  //  엑셀 내보내기 상태
  // ──────────────────────────────────────────────

  /*
   다운로드 처리 중 여부
  */
  const [exporting,    setExporting]    = useState(false)

  /*
   처리 중인 잡 ID
  */
  const [exportJobId,  setExportJobId]  = useState<number | null>(null)

  /*
   사용자에게 표시할 처리 상태 메시지
  */
  const [exportStatus, setExportStatus] = useState<string>("")

  /*
   폴링 인터벌 ref
   언마운트 또는 완료 시 clearInterval 필수
  */
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /*
   컴포넌트 언마운트 시 폴링 정리
  */
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  // ──────────────────────────────────────────────
  //  쿠폰 마스터 등록 모달 상태
  // ──────────────────────────────────────────────

  /*
   등록 모달 열림 여부
  */
  const [createModalOpen, setCreateModalOpen] = useState(false)

  /*
   등록 폼 입력값 상태
   초기값: 할인 유형 기본값 percent
  */
  const [createForm, setCreateForm] = useState<CouponCreateForm>({
    couponName:    "",
    discountType:  "percent",
    discountValue: "",
    travelId:      "",
  })

  /*
   등록 요청 처리 중 여부
   버튼 비활성화 및 스피너 표시에 사용
  */
  const [creating, setCreating] = useState(false)


  // ──────────────────────────────────────────────
  //  쿠폰 데이터 조회
  // ──────────────────────────────────────────────

  /*
   발급 이력 API 호출
  */
  const fetchIssuedCoupons = async () => {
    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/coupon/list`
      )
      if (!res.ok) { setIssuedCoupons([]); return }
      const data = await res.json()
      setIssuedCoupons(Array.isArray(data) ? data : [])
    } catch {
      setIssuedCoupons([])
    }
  }

  /*
   쿠폰 정책 API 호출
  */
  const fetchCouponMasters = async () => {
    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/coupon/masters`
      )
      if (!res.ok) { setCouponMasters([]); return }
      const data = await res.json()
      setCouponMasters(Array.isArray(data) ? data : [])
    } catch {
      setCouponMasters([])
    }
  }

  // 페이지 진입 시 두 API 동시 호출
  useEffect(() => {
    fetchIssuedCoupons()
    fetchCouponMasters()
  }, [])

  // ──────────────────────────────────────────────
  //  표시용 헬퍼 함수
  // ──────────────────────────────────────────────

  /*
   discountType 라벨 변환
  */
  const discountLabel = (type: string, value: number) => {
    if (type === "percent") return `${value}% 할인`
    if (type === "amount")  return `${value.toLocaleString()}원 할인`
    return `${value}`
  }

  /*
   usedYn 라벨 변환
  */
  const usedLabel = (usedYn: number) =>
    usedYn === 1 ? (
      <span className="text-gray-400">사용됨</span>
    ) : (
      <span className="text-green-600 font-semibold">미사용</span>
    )

  /*
   발급 일시 포맷
   "2024-01-15T10:30:00" → "2024-01-15 10:30"
  */
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-"
    return dateStr.replace("T", " ").slice(0, 16)
  }

  // ──────────────────────────────────────────────
  //  엑셀 내보내기 (비동기 잡 큐 방식)
  // ──────────────────────────────────────────────

  /*
   쿠폰 발급 내역 엑셀 내보내기 요청

   흐름
   1. POST /api/admin/export/request?type=COUPONS → jobId 수신
   2. 3초 간격 폴링으로 상태 확인
   3. COMPLETED → 자동 다운로드
   4. FAILED    → 오류 표시
  */
  const handleExportRequest = async () => {
    setExporting(true)
    setExportStatus("처리 중...")

    try {
      /*
       잡 등록
       admin-service → batch-service 위임
       즉시 jobId 반환
      */
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/export/request?type=COUPONS`,
        { method: "POST" }
      )

      if (!res.ok) {
        setExportStatus("요청 실패")
        setExporting(false)
        return
      }

      const data          = await res.json()
      const jobId: number = data.jobId
      setExportJobId(jobId)

      /*
       폴링 시작
       3초마다 상태 조회
      */
      pollRef.current = setInterval(() => {
        pollExportStatus(jobId)
      }, 3000)

    } catch (err) {
      console.error("엑셀 내보내기 요청 실패", err)
      setExportStatus("요청 실패")
      setExporting(false)
    }
  }

  /*
   잡 상태 폴링
  */
  const pollExportStatus = async (jobId: number) => {
    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/export/status/${jobId}`
      )

      if (!res.ok) return

      const job: ExportJobStatus = await res.json()

      if (job.status === "COMPLETED") {
        if (pollRef.current) clearInterval(pollRef.current)
        setExportStatus("완료! 다운로드 중...")
        await triggerDownload(jobId, job.fileName ?? "coupons.xlsx")
        setExportStatus("")
        setExporting(false)
        setExportJobId(null)

      } else if (job.status === "FAILED") {
        if (pollRef.current) clearInterval(pollRef.current)
        setExportStatus("생성 실패")
        setExporting(false)
      }

    } catch (err) {
      console.error("상태 조회 실패", err)
    }
  }

  /*
   파일 다운로드 트리거
   Blob URL → a 태그 클릭 패턴
  */
  const triggerDownload = async (jobId: number, fileName: string) => {
    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/export/download/${jobId}`
      )

      if (!res.ok) { alert("다운로드 실패"); return }

      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement("a")
      a.href     = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url) // 메모리 해제
    } catch (err) {
      console.error("파일 다운로드 실패", err)
      alert("파일 다운로드 실패")
    }
  }

  // ──────────────────────────────────────────────
  //  쿠폰 마스터 등록
  // ──────────────────────────────────────────────

  /*
   등록 모달 열기
   폼 초기화 후 모달 표시
  */
  const openCreateModal = () => {
    setCreateForm({
      couponName:    "",
      discountType:  "percent",
      discountValue: "",
      travelId:      "",
    })
    setCreateModalOpen(true)
  }

  /*
   쿠폰 마스터 등록 폼 제출
   POST /api/admin/coupon/master → travel-service 위임
   coupon_code 는 travel-service 에서 자동 생성됨
  */
  const handleCreateCoupon = async () => {

    // 필수 입력 검증
    if (!createForm.couponName.trim()) {
      alert("쿠폰 이름을 입력해주세요")
      return
    }
    if (!createForm.discountValue || isNaN(Number(createForm.discountValue))) {
      alert("할인 값을 숫자로 입력해주세요")
      return
    }

    setCreating(true)

    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/coupon/master`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            couponName:    createForm.couponName.trim(),
            discountType:  createForm.discountType,
            discountValue: Number(createForm.discountValue),
            // travelId 가 비어있으면 null 처리
            travelId: createForm.travelId.trim() || null,
          }),
        }
      )

      if (!res.ok) {
        alert("쿠폰 등록 실패")
        setCreating(false)
        return
      }

      const data = await res.json()

      // 쿠폰 정책 목록 새로고침 (모달 닫기 전 테이블 반영)
      await fetchCouponMasters()

      // 모달 닫기
      setCreateModalOpen(false)

      // 등록 성공 알림 - 자동 생성된 쿠폰 코드를 alert 로 표시
      // 모달이 닫힌 후 코드를 확인할 수 있도록 alert 사용
      alert(`쿠폰 등록 완료!\n쿠폰 코드: ${data.couponCode}`)

    } catch (err) {
      console.error("쿠폰 등록 실패", err)
      alert("쿠폰 등록 중 오류가 발생했습니다")
    } finally {
      setCreating(false)
    }
  }

  // ──────────────────────────────────────────────
  //  렌더링
  // ──────────────────────────────────────────────

  return (
    <div className="p-8">

      {/* 페이지 헤더 + 버튼 영역 */}
      <div className="flex items-center justify-between mb-6">

        <h1 className="text-2xl font-bold">쿠폰 관리</h1>

        <div className="flex items-center gap-3">

          {exportStatus && (
            <span className="text-sm text-gray-500">{exportStatus}</span>
          )}

          {/*
            엑셀 다운로드 버튼
            발급 이력 탭에서만 표시
            처리 중이면 스피너 + 비활성화
          */}
          {tab === "issued" && (
            <button
              onClick={handleExportRequest}
              disabled={exporting}
              className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold transition-colors ${
                exporting
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {exporting ? "처리 중..." : "발급 내역 엑셀"}
            </button>
          )}

          {/*
            쿠폰 등록 버튼
            쿠폰 정책 탭에서만 표시
          */}
          {tab === "masters" && (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              쿠폰 등록
            </button>
          )}

        </div>
      </div>

      {/* 탭 버튼 */}
      <div className="flex gap-2 mb-6">
        <button
          className={`px-5 py-2 rounded font-semibold ${
            tab === "issued"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          onClick={() => setTab("issued")}
        >
          발급 이력
        </button>
        <button
          className={`px-5 py-2 rounded font-semibold ${
            tab === "masters"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          onClick={() => setTab("masters")}
        >
          쿠폰 정책
        </button>
      </div>

      {/* 발급 이력 탭 */}
      {tab === "issued" && (
        <div>
          <p className="text-sm text-gray-500 mb-3">
            총 {issuedCoupons.length}건
          </p>
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 border">사용자</th>
                <th className="p-3 border">쿠폰명</th>
                <th className="p-3 border">할인 내용</th>
                <th className="p-3 border">여행지</th>
                <th className="p-3 border">발급 일시</th>
                <th className="p-3 border">사용 여부</th>
              </tr>
            </thead>
            <tbody>
              {issuedCoupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-6 text-gray-400">
                    발급된 쿠폰이 없습니다
                  </td>
                </tr>
              ) : (
                issuedCoupons.map((coupon, i) => (
                  <tr key={i} className="text-center hover:bg-gray-50">
                    <td className="p-3 border">{coupon.username}</td>
                    <td className="p-3 border">{coupon.couponName}</td>
                    <td className="p-3 border">
                      {discountLabel(coupon.discountType, coupon.discountValue)}
                    </td>
                    <td className="p-3 border text-gray-500">
                      {coupon.travelId ?? "-"}
                    </td>
                    <td className="p-3 border">{formatDate(coupon.issuedAt)}</td>
                    <td className="p-3 border">{usedLabel(coupon.usedYn)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 쿠폰 정책 탭 */}
      {tab === "masters" && (
        <div>
          <p className="text-sm text-gray-500 mb-3">
            총 {couponMasters.length}개 정책
          </p>
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 border">ID</th>
                <th className="p-3 border">쿠폰 코드</th>
                <th className="p-3 border">쿠폰명</th>
                <th className="p-3 border">할인 내용</th>
                <th className="p-3 border">연결 여행지</th>
              </tr>
            </thead>
            <tbody>
              {couponMasters.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-6 text-gray-400">
                    등록된 쿠폰 정책이 없습니다
                  </td>
                </tr>
              ) : (
                couponMasters.map((master) => (
                  <tr key={master.couponId} className="text-center hover:bg-gray-50">
                    <td className="p-3 border text-gray-400">{master.couponId}</td>
                    <td className="p-3 border font-mono text-xs">{master.couponCode}</td>
                    <td className="p-3 border font-semibold">{master.couponName}</td>
                    <td className="p-3 border">
                      {discountLabel(master.discountType, master.discountValue)}
                    </td>
                    <td className="p-3 border text-gray-500">
                      {master.travelId ?? "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ──────────────────────────────────────────────
          쿠폰 마스터 등록 모달
          쿠폰 정책 탭 "쿠폰 등록" 버튼 클릭 시 표시
      ────────────────────────────────────────────── */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow w-96">

            <h2 className="text-lg font-bold mb-5">쿠폰 정책 등록</h2>

            {/*
              쿠폰 이름 입력
              coupon_master.coupon_name 컬럼
            */}
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1">
                쿠폰 이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="예: 여름 특가 할인 쿠폰"
                value={createForm.couponName}
                onChange={e => setCreateForm(f => ({ ...f, couponName: e.target.value }))}
                className="border p-2 w-full rounded text-sm"
              />
            </div>

            {/*
              할인 유형 선택
              coupon_master.discount_type 컬럼
              percent = 퍼센트 할인 / amount = 금액 할인
            */}
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1">
                할인 유형 <span className="text-red-500">*</span>
              </label>
              <select
                value={createForm.discountType}
                onChange={e => setCreateForm(f => ({ ...f, discountType: e.target.value }))}
                className="border p-2 w-full rounded text-sm"
              >
                <option value="percent">% 할인 (퍼센트)</option>
                <option value="amount">원 할인 (금액)</option>
              </select>
            </div>

            {/*
              할인 값 입력
              coupon_master.discount_value 컬럼
              percent: 1~100 / amount: 양수 금액
            */}
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1">
                할인 값 <span className="text-red-500">*</span>
                <span className="text-gray-400 font-normal ml-1">
                  {createForm.discountType === "percent" ? "(예: 10 → 10% 할인)" : "(예: 5000 → 5000원 할인)"}
                </span>
              </label>
              <input
                type="number"
                placeholder={createForm.discountType === "percent" ? "1 ~ 100" : "할인 금액"}
                min={1}
                value={createForm.discountValue}
                onChange={e => setCreateForm(f => ({ ...f, discountValue: e.target.value }))}
                className="border p-2 w-full rounded text-sm"
              />
            </div>

            {/*
              연결 여행지 ID 입력 (선택)
              coupon_master.travel_id 컬럼
              특정 여행지에 연결하지 않으면 비워도 됨
            */}
            <div className="mb-5">
              <label className="block text-sm font-semibold mb-1">
                연결 여행지 ID
                <span className="text-gray-400 font-normal ml-1">(선택 사항)</span>
              </label>
              <input
                type="text"
                placeholder="여행지 ID (없으면 비워두세요)"
                value={createForm.travelId}
                onChange={e => setCreateForm(f => ({ ...f, travelId: e.target.value }))}
                className="border p-2 w-full rounded text-sm"
              />
            </div>

            {/*
              쿠폰 코드 안내 문구
              coupon_code 는 서버에서 자동 생성됨을 안내
            */}
            <p className="text-xs text-gray-400 mb-4">
              * 쿠폰 코드는 등록 시 자동 생성됩니다 (형식: COUP-XXXXXXXX)
            </p>

            {/* 버튼 영역 */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 border rounded text-sm"
              >
                닫기
              </button>
              <button
                onClick={handleCreateCoupon}
                disabled={creating}
                className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold text-white transition-colors ${
                  creating
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                {creating ? "등록 중..." : "등록"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
