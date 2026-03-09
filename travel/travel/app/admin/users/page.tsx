"use client"

import { useEffect, useRef, useState } from "react"

/*
 fetchWithAuth 공통 유틸
 - 401 발생 시 refresh token 자동 갱신 후 재시도
 - 기존 localStorage 직접 접근 방식에서 교체
*/
import { fetchWithAuth } from "@/utils/fetchWithAuth"

/*
 Download 아이콘 - 엑셀 다운로드 버튼용
 Loader2   아이콘 - 처리 중 스피너
 CheckCircle2 - 완료 표시
*/
import { Download, Loader2, CheckCircle2 } from "lucide-react"

/*
 사용자 타입 정의
 백엔드 users 테이블 구조 기준
*/
interface User {
  username: string
  name:     string
  role:     string
}

/*
 엑셀 내보내기 잡 상태 타입
 백엔드 ExportJob 도메인 기준
*/
interface ExportJobStatus {
  id:        number
  jobType:   string
  status:    string   // PENDING / PROCESSING / COMPLETED / FAILED
  fileName?: string
}

export default function AdminUsersPage() {

  /*
   사용자 목록 state
  */
  const [users, setUsers] = useState<User[]>([])

  /*
   권한 변경 모달 상태
  */
  const [modalOpen,     setModalOpen]     = useState(false)
  const [selectedUser,  setSelectedUser]  = useState<User | null>(null)
  const [newRole,       setNewRole]       = useState("USER")

  // ──────────────────────────────────────────────
  //  엑셀 내보내기 상태
  // ──────────────────────────────────────────────

  /*
   다운로드 요청 중 여부
   true 이면 버튼 비활성화 + 스피너 표시
  */
  const [exporting, setExporting] = useState(false)

  /*
   처리 중인 잡 ID
   폴링 시 이 ID 로 상태 조회
  */
  const [exportJobId, setExportJobId] = useState<number | null>(null)

  /*
   잡 처리 상태 메시지
   "처리 중..." / "완료!" / "실패" 등 사용자에게 표시
  */
  const [exportStatus, setExportStatus] = useState<string>("")

  /*
   폴링 인터벌 ref
   컴포넌트 언마운트 시 또는 완료 시 반드시 clearInterval 해야 함
  */
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /*
   컴포넌트 언마운트 시 폴링 정리
   페이지 이동 시 인터벌이 남아 있으면 계속 API 호출하므로 반드시 정리
  */
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  // ──────────────────────────────────────────────
  //  사용자 목록 조회
  // ──────────────────────────────────────────────

  /*
   사용자 목록 조회
   fetchWithAuth 사용 - 401 시 자동 갱신
  */
  const fetchUsers = async () => {
    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`
      )

      if (!res.ok) {
        console.error("사용자 조회 실패 상태코드", res.status)
        setUsers([])
        return
      }

      const data = await res.json()

      if (Array.isArray(data)) {
        setUsers(data)
      } else if (Array.isArray(data.list)) {
        // Spring Paging 응답 대응
        setUsers(data.list)
      } else {
        setUsers([])
      }

    } catch (err) {
      console.error("사용자 조회 실패", err)
      setUsers([])
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // ──────────────────────────────────────────────
  //  권한 변경
  // ──────────────────────────────────────────────

  const openRoleModal = (user: User) => {
    setSelectedUser(user)
    setNewRole(user.role)
    setModalOpen(true)
  }

  /*
   권한 변경 API 호출
   fetchWithAuth 로 교체 (기존 localStorage 직접 접근 제거)
  */
  const changeRole = async () => {
    if (!selectedUser) return

    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${selectedUser.username}/role?role=${newRole}`,
        { method: "PUT" }
      )

      if (!res.ok) {
        alert("권한 변경 실패")
        return
      }

      alert("권한 변경 완료")
      setModalOpen(false)
      fetchUsers()

    } catch (err) {
      console.error("권한 변경 실패", err)
    }
  }

  // ──────────────────────────────────────────────
  //  엑셀 내보내기 (비동기 잡 큐 방식)
  // ──────────────────────────────────────────────

  /*
   엑셀 내보내기 요청

   흐름
   1. POST /api/admin/export/request?type=USERS → jobId 수신
   2. 폴링 시작 (3초 간격으로 상태 조회)
   3. COMPLETED → 자동 다운로드 트리거
   4. FAILED → 오류 메시지 표시
  */
  const handleExportRequest = async () => {
    setExporting(true)
    setExportStatus("처리 중...")

    try {
      /*
       잡 등록 요청
       admin-service → batch-service 로 위임
       즉시 jobId 반환 (DB INSERT만)
      */
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/export/request?type=USERS`,
        { method: "POST" }
      )

      if (!res.ok) {
        setExportStatus("요청 실패")
        setExporting(false)
        return
      }

      const data = await res.json()
      const jobId: number = data.jobId
      setExportJobId(jobId)

      /*
       폴링 시작
       3초마다 상태 조회
       COMPLETED / FAILED 시 폴링 종료
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
   잡 상태 폴링 함수

   COMPLETED → 다운로드 트리거 후 폴링 종료
   FAILED    → 오류 표시 후 폴링 종료
   PENDING/PROCESSING → 계속 폴링
  */
  const pollExportStatus = async (jobId: number) => {
    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/export/status/${jobId}`
      )

      if (!res.ok) return

      const job: ExportJobStatus = await res.json()

      if (job.status === "COMPLETED") {
        // 폴링 중단
        if (pollRef.current) clearInterval(pollRef.current)
        setExportStatus("완료! 다운로드 중...")
        // 파일 다운로드 실행
        await triggerDownload(jobId, job.fileName ?? "users.xlsx")
        setExportStatus("")
        setExporting(false)
        setExportJobId(null)

      } else if (job.status === "FAILED") {
        // 폴링 중단
        if (pollRef.current) clearInterval(pollRef.current)
        setExportStatus("생성 실패")
        setExporting(false)
      }
      // PENDING / PROCESSING 은 계속 폴링

    } catch (err) {
      console.error("상태 조회 실패", err)
    }
  }

  /*
   실제 파일 다운로드 트리거

   fetchWithAuth 로 blob 수신 후
   임시 a 태그를 생성하여 클릭 → 브라우저 파일 저장 대화상자 표시
  */
  const triggerDownload = async (jobId: number, fileName: string) => {
    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/export/download/${jobId}`
      )

      if (!res.ok) {
        alert("다운로드 실패")
        return
      }

      // 응답을 Blob 으로 변환
      const blob = await res.blob()

      // Blob URL 생성 → a 태그 클릭으로 브라우저 다운로드 트리거
      const url = URL.createObjectURL(blob)
      const a   = document.createElement("a")
      a.href     = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      // 메모리 해제 (Blob URL 은 사용 후 반드시 revoke)
      URL.revokeObjectURL(url)

    } catch (err) {
      console.error("파일 다운로드 실패", err)
      alert("파일 다운로드 실패")
    }
  }

  // ──────────────────────────────────────────────
  //  렌더링
  // ──────────────────────────────────────────────

  return (
    <div className="p-8">

      {/* 페이지 헤더 + 엑셀 다운로드 버튼 */}
      <div className="flex items-center justify-between mb-6">

        <h1 className="text-2xl font-bold">사용자 관리</h1>

        {/*
          엑셀 다운로드 버튼
          exporting=true 이면 비활성화 + 스피너 표시
          완료 후 자동으로 파일 저장 대화상자 열림
        */}
        <div className="flex items-center gap-3">

          {/* 처리 상태 메시지 */}
          {exportStatus && (
            <span className="text-sm text-gray-500">{exportStatus}</span>
          )}

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
              /*
               처리 중 스피너
               animate-spin → Tailwind 회전 애니메이션
              */
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {exporting ? "처리 중..." : "엑셀 다운로드"}
          </button>

        </div>
      </div>

      {/* 사용자 테이블 */}
      <table className="w-full border">

        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 border">아이디</th>
            <th className="p-3 border">이름</th>
            <th className="p-3 border">권한</th>
            <th className="p-3 border">권한 변경</th>
          </tr>
        </thead>

        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center p-6 text-gray-400">
                사용자가 없습니다
              </td>
            </tr>
          ) : (
            users.map(user => (
              <tr key={user.username} className="text-center">
                <td className="p-3 border">{user.username}</td>
                <td className="p-3 border">{user.name}</td>
                <td className="p-3 border font-semibold">{user.role}</td>
                <td className="p-3 border">
                  <button
                    className="bg-blue-500 text-white px-4 py-1 rounded"
                    onClick={() => openRoleModal(user)}
                  >
                    권한 변경
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>

      </table>

      {/* 권한 변경 모달 */}
      {modalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow w-80">

            <h2 className="text-lg font-bold mb-4">권한 변경</h2>
            <p className="mb-2">아이디: {selectedUser.username}</p>

            <select
              className="border p-2 w-full mb-4"
              value={newRole}
              onChange={e => setNewRole(e.target.value)}
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="px-3 py-1 border"
              >
                취소
              </button>
              <button
                onClick={changeRole}
                className="bg-blue-600 text-white px-3 py-1 rounded"
              >
                변경
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
