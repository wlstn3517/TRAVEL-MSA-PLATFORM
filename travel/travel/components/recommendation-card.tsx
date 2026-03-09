import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

/*
 cat1 코드 → 한국어 레이블 매핑
 관광공사 대분류 코드 기준
*/
const cat1Labels: Record<string, string> = {
  A01: "자연",
  A02: "문화·역사",
  A03: "액티비티",
  A04: "쇼핑",
  A05: "미식",
  B02: "숙박",
};

/*
 props 변경 내용
 제거 : description(없는 데이터), budget(없는 데이터), tags(cat1으로 대체)
 추가 : contentId(상세 이동용), addr(주소 표시용), cat1(태그 표시용)
*/
interface RecommendationCardProps {
  contentId: string;  // /destination/[contentId] 라우팅용
  name:      string;  // 여행지 이름 (travel_place.title)
  addr:      string;  // 주소 (travel_place.addr1)
  imageUrl:  string;  // 대표 이미지 (travel_place.first_image)
  cat1:      string;  // 대분류 코드 → 태그로 변환
}

export function RecommendationCard({
  contentId,
  name,
  addr,
  imageUrl,
  cat1,
}: RecommendationCardProps) {
  return (
    /*
     카드 클릭 → /destination/[contentId] 이동
     여행지 상세 페이지로 연결
    */
    <Link href={`/destination/${contentId}`}>
      <Card className="overflow-hidden transition-shadow hover:shadow-md cursor-pointer">

        {/* crossOrigin="anonymous" 제거
            외부 이미지(tong.visitkorea.or.kr) CORS 에러 방지
            canvas 픽셀 접근 없으면 불필요한 속성 */}
        <div className="aspect-[4/3] relative overflow-hidden bg-muted">
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={name}
            className="object-cover w-full h-full"
          />
        </div>

        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">

              {/* 여행지 이름 */}
              <div className="flex items-center gap-1.5 mb-1">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <h3 className="font-semibold text-card-foreground truncate">{name}</h3>
              </div>

              {/* 주소 (description 대신) */}
              <p className="text-sm text-muted-foreground line-clamp-1 mb-3">
                {addr}
              </p>

              {/* cat1 → 한국어 태그 표시 */}
              {cat1Labels[cat1] && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                  {cat1Labels[cat1]}
                </span>
              )}

            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
