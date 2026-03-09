"use client"

import { useEffect, useRef } from "react"

type KakaoMapProps = {
  lat: number
  lng: number
  name: string
}

export default function KakaoMap({ lat, lng, name }: KakaoMapProps) {

  const mapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {

    // 환경변수 키 확인 로그
    console.log("카카오키:", process.env.NEXT_PUBLIC_KAKAO_MAP_KEY);

    const w = window as any

    const loadKakaoMap = () => {

      w.kakao.maps.load(() => {

        if (!mapRef.current) return

        // 지도 중심 좌표 생성
        const center = new w.kakao.maps.LatLng(lat, lng)

        // 지도 생성
        const map = new w.kakao.maps.Map(mapRef.current, {
          center,
          level: 4,
        })

        // 마커 생성
        const marker = new w.kakao.maps.Marker({
          position: center,
        })
        marker.setMap(map)

        // 장소 이름 표시 인포윈도우
        const infoWindow = new w.kakao.maps.InfoWindow({
          content: `<div style="padding:8px 10px;font-size:13px">${name}</div>`,
        })
        infoWindow.open(map, marker)

      })
    }

    // 카카오 SDK 없으면 로드
    if (!w.kakao || !w.kakao.maps) {

      const script = document.createElement("script")
      script.async = true

      const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY

      script.src =
        `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`

      script.onload = () => loadKakaoMap()
      document.head.appendChild(script)

      return
    }

    // 이미 SDK 있으면 바로 실행
    loadKakaoMap()

  }, [lat, lng, name])

  return (
    <div
      ref={mapRef}
      className="w-full h-[360px] rounded-lg border border-border overflow-hidden"
    />
  )
}
