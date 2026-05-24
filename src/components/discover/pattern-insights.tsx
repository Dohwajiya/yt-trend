/**
 * 떡상 패턴 인사이트 카드
 * 발굴 결과의 공통점(제목 키워드·쇼츠 비율·길이·최신성)을 요약해
 * "왜 떴는지"의 단서를 PD에게 제공한다.
 */

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb } from "lucide-react";
import { formatMultiplier } from "@/lib/outlier";
import type { OutlierPatterns } from "@/types/analysis";

interface PatternInsightsProps {
  /** 패턴 분석 결과 */
  patterns: OutlierPatterns;
  /** 키워드 칩 클릭 시 (해당 키워드로 재검색) */
  onKeywordClick: (keyword: string) => void;
}

/** 초 단위를 사람이 읽기 쉽게 변환 */
function formatSeconds(sec: number): string {
  if (sec >= 60) return `${Math.round(sec / 60)}분`;
  return `${sec}초`;
}

export default function PatternInsights({
  patterns,
  onKeywordClick,
}: PatternInsightsProps) {
  if (patterns.count === 0) return null;

  const pct = (r: number) => `${Math.round(r * 100)}%`;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-5">
        <h3 className="mb-3 flex items-center gap-1.5 font-semibold">
          <Lightbulb className="h-4 w-4 text-primary" />
          왜 떴을까? — 공통 패턴 ({patterns.count}개 분석)
        </h3>

        {/* 제목 키워드 빈도 */}
        {patterns.topKeywords.length > 0 ? (
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              자주 쓰인 제목 키워드 (클릭 시 재검색)
            </p>
            <div className="flex flex-wrap gap-2">
              {patterns.topKeywords.map((k) => (
                <Badge
                  key={k.word}
                  variant="secondary"
                  className="cursor-pointer transition-colors hover:bg-primary/20 hover:text-primary"
                  onClick={() => onKeywordClick(k.word)}
                >
                  {k.word}
                  <span className="ml-1 text-[10px] text-muted-foreground">
                    {k.count}
                  </span>
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <p className="mb-4 text-xs text-muted-foreground">
            반복되는 공통 키워드가 적습니다 (다양한 제목).
          </p>
        )}

        {/* 지표 요약 */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="쇼츠 비율" value={pct(patterns.shortsRatio)} />
          <Stat label="평균 길이" value={formatSeconds(patterns.avgDurationSec)} />
          <Stat label="최근 30일" value={pct(patterns.recentRatio)} />
          <Stat
            label="배수 중앙값"
            value={formatMultiplier(patterns.medianMultiplier)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

/** 작은 지표 블록 */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-background/60 px-3 py-2">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}
