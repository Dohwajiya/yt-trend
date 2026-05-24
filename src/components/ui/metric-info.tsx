/**
 * 지표 설명 아이콘(ⓘ) 컴포넌트
 * 지표 라벨 옆에 두면 마우스 오버 시 해당 지표의 설명 툴팁을 띄운다.
 */

"use client";

import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { METRIC_INFO, type MetricKey } from "@/lib/metric-info";
import { cn } from "@/lib/utils";

interface MetricInfoProps {
  /** 설명을 표시할 지표 키 */
  metric: MetricKey;
  /** 추가 클래스 */
  className?: string;
}

export default function MetricInfo({ metric, className }: MetricInfoProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        aria-label="지표 설명"
        className={cn(
          "inline-flex shrink-0 cursor-help align-middle text-muted-foreground/70 transition-colors hover:text-foreground",
          className
        )}
      >
        <Info className="h-3.5 w-3.5" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-left leading-relaxed">
        {METRIC_INFO[metric]}
      </TooltipContent>
    </Tooltip>
  );
}
