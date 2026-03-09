"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

/*
 fetchWithAuth 공통 유틸 import
 - 기존: localStorage 직접 읽어 토큰 수동 세팅 (fetchBatchLogs + fetchStats 3곳)
 - 변경: fetchWithAuth가 자동으로 토큰 포함 + 401 시 refresh token 갱신 후 재시도
 - 효과: 배치 로그 / 성공률 / 카운트 조회 시 토큰 만료 자동 처리
*/
import { fetchWithAuth } from "@/utils/fetchWithAuth"

/*
 배치 로그 타입 정의

 백엔드 BatchLog 엔티티 기준
*/
interface BatchLog {
  batchId: number
  batchName: string
  startTime: string
  endTime: string
  status: string
  processedCount: number
  errorMessage: string
}

/*
 관리자 배치 로그 페이지

 기능

 1 관리자 권한 체크
 2 배치 로그 조회
 3 성공률 통계 표시
 4 총 실행 횟수 표시
*/
export default function AdminBatchLogsPage() {

  const router = useRouter()

  /*
   배치 로그 목록 상태
  */
  const [logs, setLogs] = useState<BatchLog[]>([])

  /*
   통계 데이터 상태
  */
  const [successRate, setSuccessRate] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  /*
   관리자 권한 체크

   관리자 아니면 메인 이동
  */
  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    const role = localStorage.getItem("role")

    if (!token || role !== "ADMIN") {
      alert("관리자만 접근 가능")
      router.push("/")
      return
    }

    fetchBatchLogs()
    fetchStats()
  }, [])

  /*
   배치 로그 조회 함수
  */
  const fetchBatchLogs = async () => {
    try {
      /*
       fetchWithAuth로 교체한 이유
       - 기존: localStorage.getItem("accessToken")으로 직접 토큰 읽어 헤더에 수동 설정
       - 문제: 토큰 만료 시 401 받아도 자동 갱신 없이 배치 로그 조회 실패
       - 변경: fetchWithAuth가 토큰 자동 포함 + 401 시 refresh 후 재시도
      */
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/batch/logs`
      )

      if (!res.ok) {
        console.error("배치 로그 조회 실패", res.status)
        setLogs([])
        return
      }

      const data = await res.json()
      setLogs(data)

    } catch (err) {
      console.error("배치 로그 오류", err)
      setLogs([])
    }
  }

  /*
   배치 통계 조회 함수

   성공률과 전체 실행 횟수 조회
  */
  const fetchStats = async () => {
    try {
      /*
       성공률 + 총 실행 횟수 두 API 동시 호출
       - 기존: localStorage 직접 읽어 각 fetch에 수동으로 Authorization 헤더 설정
       - 변경: fetchWithAuth로 교체 → 두 호출 모두 토큰 자동 포함 + 401 시 자동 갱신
      */
      const rateRes = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/batch/success-rate`
      )

      const countRes = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/batch/count`
      )

      if (rateRes.ok) {
        const rate = await rateRes.json()
        setSuccessRate(rate)
      }

      if (countRes.ok) {
        const count = await countRes.json()
        setTotalCount(count)
      }

    } catch (err) {
      console.error("배치 통계 조회 오류", err)
    }
  }

  return (
    <div className="p-8">

      {/* 페이지 제목 */}
      <h1 className="text-2xl font-bold mb-6">
        배치 로그 관리
      </h1>

      {/* 통계 카드 영역 */}
      <div className="flex gap-6 mb-8">

        <div className="bg-white p-4 rounded shadow w-48">
          <p className="text-gray-500">총 실행 횟수</p>
          <p className="text-xl font-bold">
            {totalCount}
          </p>
        </div>

        <div className="bg-white p-4 rounded shadow w-48">
          <p className="text-gray-500">배치 성공률</p>
          <p className="text-xl font-bold">
            {successRate} %
          </p>
        </div>

      </div>

      {/* 배치 로그 테이블 */}
      <table className="w-full border bg-white">

        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">배치명</th>
            <th className="border p-2">시작 시간</th>
            <th className="border p-2">종료 시간</th>
            <th className="border p-2">상태</th>
            <th className="border p-2">처리 건수</th>
            <th className="border p-2">오류 메시지</th>
          </tr>
        </thead>

        <tbody>
          {logs.map(log => (
            <tr key={log.batchId} className="text-center">

              <td className="border p-2">
                {log.batchName}
              </td>

              <td className="border p-2">
                {log.startTime}
              </td>

              <td className="border p-2">
                {log.endTime || "-"}
              </td>

              <td className="border p-2 font-semibold">
                {log.status}
              </td>

              <td className="border p-2">
                {log.processedCount}
              </td>

              <td className="border p-2 text-red-500">
                {log.errorMessage || "-"}
              </td>

            </tr>
          ))}
        </tbody>

      </table>

    </div>
  )
}