import { Clock, Calendar, MapPin, Wallet } from "lucide-react";

interface TravelInfoProps {
  bestSeason: string;
  recommendedDays: string;
  averageBudget: string;
  transportation: string;
}

export function TravelInfo({
  bestSeason,
  recommendedDays,
  averageBudget,
  transportation,
}: TravelInfoProps) {
  const infoItems = [
    {
      icon: Calendar,
      label: "추천 시기",
      value: bestSeason,
    },
    {
      icon: Clock,
      label: "추천 일정",
      value: recommendedDays,
    },
    {
      icon: Wallet,
      label: "평균 예산",
      value: averageBudget,
    },
    {
      icon: MapPin,
      label: "교통편",
      value: transportation,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {infoItems.map((item) => (
        <div
          key={item.label}
          className="flex items-start gap-3 p-4 bg-muted rounded-lg"
        >
          <div className="p-2 bg-card rounded-md">
            <item.icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="font-medium text-foreground">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
