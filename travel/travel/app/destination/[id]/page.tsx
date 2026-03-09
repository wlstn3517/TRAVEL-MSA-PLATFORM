"use client";

/*
 리액트 상태관리 훅
 쿠폰 버튼 상태 관리용
*/
import { useState, useEffect } from "react";

/*
 Next.js 라우터 파라미터 가져오기
 destination id 받기용
*/
import { useParams, useRouter } from "next/navigation";

/*
 로그인 상태 체크용 util
 localStorage JWT 토큰 가져오기
*/
import { getToken } from "@/utils/auth";

/*
 fetchWithAuth 공통 유틸 import
 - handleCouponRequest에서 사용
 - 401 발생 시 refresh token 자동 갱신 + 재시도
 - 기존 코드에 Authorization: token (Bearer 누락 버그) 있었음 → 수정 포함
*/
import { fetchWithAuth } from "@/utils/fetchWithAuth";

import { Header } from "@/components/header";
import { ImageGallery } from "@/components/image-gallery";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Ticket, Check } from "lucide-react";

/*
 TravelInfo 제거
 추천 시기, 교통편, 평균 예산 등 여행 부가정보는 travel_place에 없는 데이터
 "정보 없음"만 표시되는 의미 없는 UI였으므로 제거
*/

/*
 카카오 지도 컴포넌트
*/
import KakaoMap from "@/components/kakao-map";

/*
 fallback 데이터
 api 실패 시 기본 표시용
*/
/*
 fallback 데이터
 API 호출 실패 시 초기 상태값
 travelInfo 제거 - TravelInfo 컴포넌트 삭제로 불필요
*/
const destinationData = {
  jeju: {
    id: "jeju",
    name: "제주도",
    region: "제주특별자치도",
    images: [{ url: "/placeholder.jpg", alt: "임시 이미지" }],
    lat: 33.450701,
    lng: 126.570667,
  },
};

export default function DestinationDetailPage() {

  /*
   쿠폰 발급 버튼 상태
  */
  const [couponRequested, setCouponRequested] = useState(false);

  /*
   상세 데이터 상태
  */
  const [destination, setDestination] = useState(destinationData.jeju);

  /*
   URL 파라미터
  */
  const params = useParams();
  const id = params.id;

  /*
   로그인 안되면 로그인 페이지 이동용
  */
  const router = useRouter();

  /*
   여행 상세 API 호출 + 방문 이력 기록
  */
  useEffect(() => {

    const fetchDetail = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/travel/detail/${id}`
        );

        const data = await res.json();

        setDestination({
          id:     data.content_id,
          name:   data.title,
          region: data.addr1,
          images: [{ url: data.first_image, alt: data.title }],
          lat:    data.map_y,
          lng:    data.map_x,
        });

        /*
         방문 이력 기록
         로그인한 사용자만 기록 (토큰 없으면 건너뜀)
         화면 로딩과 무관하게 백그라운드로 처리
        */
        const token = getToken();
        if (token) {
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/travel/history`, {
            method: "POST",
            headers: {
              // travel-service JWT 필터가 "Bearer " 접두사 필수로 요구함
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contentId:  String(data.content_id),
              title:      data.title      ?? "",
              firstImage: data.first_image ?? "",
              addr1:      data.addr1      ?? "",
            }),
          }).catch(() => {
            // 이력 기록 실패는 사용자 화면에 영향 없음
          });
        }

      } catch (e) {
        console.error("상세 API 실패", e);
      }
    };

    if (id) fetchDetail();

  }, [id]);

  /*
   ⭐ 쿠폰 발급 API 연결 핵심 부분 ⭐
  */
  const handleCouponRequest = async () => {

    const token = getToken();

    /*
     로그인 안된 경우 로그인 페이지 이동
     fetchWithAuth를 쓰기 전에 로그인 여부를 먼저 확인하는 이유:
     비로그인 사용자에게 쿠폰 발급 요청 자체를 막고 로그인 유도 UX 제공
    */
    if (!token) {
      router.push("/login");
      return;
    }

    try {

      /*
       fetchWithAuth로 교체한 이유
       - 기존 버그: Authorization: token → "Bearer " 접두사 없이 토큰 값만 전달
                   travel-service JWT 필터가 "Bearer "로 시작하는 토큰만 파싱하므로
                   인증 실패하여 쿠폰 발급이 항상 401 오류 발생했음
       - 수정: fetchWithAuth 내부에서 Authorization: `Bearer ${token}` 형태로 자동 설정
       - 추가 효과: 401 발생 시 refresh token 자동 갱신 후 재시도
      */
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/travel/coupon/issue/${id}`,
        {
          method: "POST",
        }
      );

      /*
       실패 시 메시지 출력
      */
      if (!res.ok) {
        const msg = await res.text();
        alert("쿠폰 발급 실패: " + msg);
        return;
      }

      /*
       성공 시 버튼 상태 변경
      */
      setCouponRequested(true);

    } catch (e) {
      console.error("쿠폰 API 오류", e);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8">

        {/*
         뒤로가기 버튼
         router.back() 사용 이유: 검색 페이지 또는 추천 페이지 등
         어디서 진입했든 이전 페이지로 돌아갈 수 있음
        */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          이전으로
        </button>

        <ImageGallery images={destination.images} />

        <Button
          onClick={handleCouponRequest}
          disabled={couponRequested}
          className="w-full mt-6"
        >
          {couponRequested ? (
            <>
              <Check /> 쿠폰 발급 완료
            </>
          ) : (
            <>
              <Ticket /> 쿠폰 요청하기
            </>
          )}
        </Button>

        <KakaoMap
          lat={destination.lat}
          lng={destination.lng}
          name={destination.name}
        />

      </main>
    </div>
  );
}
