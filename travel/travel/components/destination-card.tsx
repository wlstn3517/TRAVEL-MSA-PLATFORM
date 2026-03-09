import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/*
 여행지 카드 컴포넌트

 역할
 여행 리스트 화면에서 여행지 카드 표시
 추천 여행지일 경우 추천 badge 표시
 상세 페이지 이동 링크 포함
*/
interface DestinationCardProps {
  id: string;
  name: string;
  region: string;
  description: string;
  imageUrl: string;

  // 추천 여부 Y 또는 N
  recommendYn?: string;
}

export function DestinationCard({
  id,
  name,
  region,
  description,
  imageUrl,
  recommendYn,
}: DestinationCardProps) {
  return (
    <Link href={`/destination/${id}`}>
      <Card className="overflow-hidden transition-all hover:shadow-lg cursor-pointer group">

        {/* 여행지 이미지 영역
            crossOrigin="anonymous" 는 달면 브라우저가 CORS 요청으로 처리해서
            tong.visitkorea.or.kr 같은 외부 서버 이미지가 차단됨
            단순 화면 표시 용도라면 속성 없이 그냥 src만 쓰면 됨 */}
        <div className="aspect-[16/10] relative overflow-hidden bg-muted">
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={name}
            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
          />

          {/* 추천 여행지 badge 표시 */}
          {recommendYn === "Y" && (
            <div className="absolute top-2 left-2">
              <Badge>추천</Badge>
            </div>
          )}
        </div>

        {/* 여행지 텍스트 정보 영역 */}
        <CardContent className="p-4">

          {/* 지역 표시 */}
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-1">
            <MapPin className="h-3.5 w-3.5" />
            <span>{region}</span>
          </div>

          {/* 여행지 이름 */}
          <h3 className="font-semibold text-lg text-card-foreground mb-2">
            {name}
          </h3>

          {/* 여행지 설명 */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>

        </CardContent>
      </Card>
    </Link>
  );
}
