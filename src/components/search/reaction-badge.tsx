/**
 * 반응도 배지 컴포넌트
 * Good(초록)/Normal(회색)/Bad(빨강) 등급을 시각적으로 표시
 */

import { Badge } from "@/components/ui/badge";
import type { ReactionGrade } from "@/types/analysis";
import { getReactionColorClass } from "@/lib/reaction";
import { formatRatio } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ReactionBadgeProps {
  /** 반응도 등급 */
  grade: ReactionGrade;
  /** 반응도 비율 (조회수/구독자) */
  ratio: number;
  /** 구독자 수 (0이면 N/A 표시) */
  subscriberCount?: number;
}

/**
 * 반응도 등급에 따라 색상이 다른 배지를 렌더링
 * 구독자 수가 0이면 "N/A"로 표시
 */
export default function ReactionBadge({
  grade,
  ratio,
  subscriberCount,
}: ReactionBadgeProps) {
  // 구독자 수가 없거나 0이면 판정 불가
  if (subscriberCount !== undefined && subscriberCount <= 0) {
    return (
      <Badge
        variant="outline"
        className="bg-gray-500/10 text-gray-500 border-gray-500/20"
      >
        N/A
      </Badge>
    );
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <Badge
        variant="outline"
        className={cn("font-semibold", getReactionColorClass(grade))}
      >
        {grade}
      </Badge>
      <span className="text-[10px] text-muted-foreground">
        {formatRatio(ratio)}
      </span>
    </div>
  );
}
