"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

/*
 ImageGallery 컴포넌트

 목적
 여행 상세 페이지 이미지 갤러리

 주요 기능
 메인 이미지 표시
 썸네일 클릭시 변경
 이미지 없을 때 placeholder 처리
 이미지 개수 표시
*/
interface ImageGalleryProps {
  images: {
    url: string;
    alt: string;
  }[];
}

export function ImageGallery({ images }: ImageGalleryProps) {

  /*
   선택된 이미지 인덱스 상태
  */
  const [selectedIndex, setSelectedIndex] = useState(0);

  /*
   이미지 배열 안전 처리
   이미지 없으면 placeholder 자동 생성
  */
  const safeImages =
    images && images.length > 0
      ? images
      : [{ url: "/placeholder.svg", alt: "이미지 없음" }];

  /*
   여행지 변경 시 첫번째 이미지 자동 선택
  */
  useEffect(() => {
    setSelectedIndex(0);
  }, [images]);

  return (
    <div className="space-y-3">

      {/* 메인 이미지 영역 */}
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg">
        <Image
          src={safeImages[selectedIndex].url || "/placeholder.svg"}
          alt={safeImages[selectedIndex].alt}
          fill
          className="object-cover"
        />
      </div>

      {/* 이미지 개수 표시 */}
      <div className="text-xs text-muted-foreground text-right">
        {safeImages.length}장 중 {selectedIndex + 1}번째 이미지
      </div>

      {/* 썸네일 영역 */}
      <div className="grid grid-cols-4 gap-2">

        {safeImages.map((image, index) => (

          <button
            key={index}
            onClick={() => setSelectedIndex(index)}
            className={`relative aspect-[4/3] overflow-hidden rounded-md transition-all ${
              selectedIndex === index
                ? "ring-2 ring-foreground ring-offset-2"
                : "opacity-70 hover:opacity-100"
            }`}
          >
            <Image
              src={image.url || "/placeholder.svg"}
              alt={image.alt}
              fill
              className="object-cover"
            />
          </button>

        ))}
      </div>
    </div>
  );
}
