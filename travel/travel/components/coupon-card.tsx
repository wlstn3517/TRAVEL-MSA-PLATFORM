"use client"

/*
 쿠폰 카드 UI 컴포넌트

 목적

 마이페이지에서 사용자 쿠폰 목록 표시용
 API 연결 전에도 재사용 가능

 props로 쿠폰 데이터 받아서 표시
*/

type CouponCardProps = {
  couponName?: string
  discountType?: string
  discountValue?: number
  travelId?: string
  usedYn?: string
}

export default function CouponCard({
  couponName,
  discountType,
  discountValue,
  travelId,
  usedYn,
}: CouponCardProps) {

  /*
   할인 표시 문자열 생성

   percent -> 10%
   amount -> 5000원

   백엔드 응답 누락 대비 기본값 처리
  */
  const discountLabel =
    discountType === "percent"
      ? `${discountValue ?? 0}% 할인`
      : `${discountValue ?? 0}원 할인`

  /*
   쿠폰 이름 null 방지 처리
  */
  const safeCouponName = couponName ?? "쿠폰 정보 없음"

  /*
   사용 여부 기본값 처리
  */
  const safeUsedYn = usedYn ?? "N"

  return (
    <div
      className={`
        border rounded-xl p-5 shadow-sm
        flex justify-between items-center
        ${safeUsedYn === "Y" ? "bg-gray-100 opacity-60" : "bg-white"}
      `}
    >

      {/* 쿠폰 정보 영역 */}
      <div>

        {/* 쿠폰 이름 */}
        <h3 className="text-lg font-semibold">
          {safeCouponName}
        </h3>

        {/* 할인 표시 */}
        <p className="text-blue-600 font-bold">
          {discountLabel}
        </p>

        {/* 여행지 ID 표시 (선택) */}
        {travelId && (
          <p className="text-sm text-gray-500">
            여행지 ID: {travelId}
          </p>
        )}

      </div>

      {/* 사용 여부 표시 */}
      <div>

        {safeUsedYn === "Y" ? (
          <span className="text-red-500 font-semibold">
            사용 완료
          </span>
        ) : (
          <span className="text-green-600 font-semibold">
            사용 가능
          </span>
        )}

      </div>

    </div>
  )
}
