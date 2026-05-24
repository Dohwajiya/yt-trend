/**
 * 2채널 헤드투헤드 비교 페이지
 * /compare?a=채널ID&b=채널ID 로 진입하여 두 채널의 핵심 지표를 나란히 비교하고,
 * 건강도 레이더 차트를 오버레이로 표시한다.
 */

"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Swords } from "lucide-react";
import HealthRadarChart from "@/components/charts/health-radar-chart";
import MetricInfo from "@/components/ui/metric-info";
import { calculateAverageReactionRatio } from "@/lib/keyword-analysis";
import { formatNumber, formatRatio } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MetricKey } from "@/lib/metric-info";
import type { CompareApiResponse, CompareChannelData } from "@/types/analysis";

/** 비교 지표 한 행을 렌더링 (더 높은 쪽 강조) */
function MetricRow({
  label,
  aDisplay,
  bDisplay,
  aValue,
  bValue,
  higherBetter = true,
  metric,
}: {
  label: string;
  aDisplay: string;
  bDisplay: string;
  aValue: number;
  bValue: number;
  higherBetter?: boolean;
  metric?: MetricKey;
}) {
  // 승자 판정 (동점이면 강조 없음)
  let aWins = false;
  let bWins = false;
  if (aValue !== bValue) {
    const aBetter = higherBetter ? aValue > bValue : aValue < bValue;
    aWins = aBetter;
    bWins = !aBetter;
  }

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-border/40 py-2.5 last:border-b-0">
      <span
        className={cn(
          "text-right text-sm",
          aWins ? "font-bold text-primary" : "text-foreground"
        )}
      >
        {aDisplay}
      </span>
      <span className="inline-flex items-center justify-center gap-1 px-3 text-center text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
        {metric && <MetricInfo metric={metric} />}
      </span>
      <span
        className={cn(
          "text-left text-sm",
          bWins ? "font-bold text-primary" : "text-foreground"
        )}
      >
        {bDisplay}
      </span>
    </div>
  );
}

/** 채널 헤더 (썸네일 + 이름 + 구독자) */
function ChannelHead({ data }: { data: CompareChannelData }) {
  const { stats } = data;
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      {stats.channelThumbnailUrl && (
        <Image
          src={stats.channelThumbnailUrl}
          alt={stats.channelTitle}
          width={56}
          height={56}
          className="rounded-full"
        />
      )}
      <div>
        <p className="font-bold">{stats.channelTitle || "채널"}</p>
        <p className="text-xs text-muted-foreground">
          구독 {stats.subscriberCount > 0 ? formatNumber(stats.subscriberCount) : "비공개"}
        </p>
      </div>
    </div>
  );
}

function CompareContent() {
  const searchParams = useSearchParams();
  const a = searchParams.get("a");
  const b = searchParams.get("b");

  const [data, setData] = useState<CompareApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      if (!a || !b) {
        setError("비교할 두 채널이 지정되지 않았습니다.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/youtube/compare?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`
        );
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error ?? "비교 데이터를 불러올 수 없습니다.");
        }
        setData(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    }
    run();
  }, [a, b]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-6">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error ?? "데이터를 불러올 수 없습니다."}
        </div>
        <Link href="/competitors" className="mt-4 inline-block">
          <Button variant="outline">경쟁 채널로 돌아가기</Button>
        </Link>
      </div>
    );
  }

  const { channelA, channelB } = data;
  const avgReactionA = calculateAverageReactionRatio(channelA.videos);
  const avgReactionB = calculateAverageReactionRatio(channelB.videos);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold">채널 헤드투헤드 비교</h1>
        </div>
        <Link href="/competitors">
          <Button variant="outline" size="sm">목록으로</Button>
        </Link>
      </div>

      {/* 채널 헤더 + VS */}
      <Card>
        <CardContent className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 p-5">
          <ChannelHead data={channelA} />
          <span className="text-xl font-black text-muted-foreground">VS</span>
          <ChannelHead data={channelB} />
        </CardContent>
      </Card>

      {/* 핵심 지표 비교 */}
      <Card>
        <CardContent className="p-5">
          <h3 className="mb-2 font-semibold">핵심 지표</h3>
          <MetricRow
            label="구독자"
            aDisplay={formatNumber(channelA.stats.subscriberCount)}
            bDisplay={formatNumber(channelB.stats.subscriberCount)}
            aValue={channelA.stats.subscriberCount}
            bValue={channelB.stats.subscriberCount}
          />
          <MetricRow
            label="총 조회수"
            aDisplay={formatNumber(channelA.stats.totalViewCount)}
            bDisplay={formatNumber(channelB.stats.totalViewCount)}
            aValue={channelA.stats.totalViewCount}
            bValue={channelB.stats.totalViewCount}
          />
          <MetricRow
            label="총 영상 수"
            aDisplay={formatNumber(channelA.stats.totalVideoCount)}
            bDisplay={formatNumber(channelB.stats.totalVideoCount)}
            aValue={channelA.stats.totalVideoCount}
            bValue={channelB.stats.totalVideoCount}
          />
          <MetricRow
            label="평균 반응도"
            metric="avgReaction"
            aDisplay={formatRatio(avgReactionA)}
            bDisplay={formatRatio(avgReactionB)}
            aValue={avgReactionA}
            bValue={avgReactionB}
          />
          <MetricRow
            label="건강도 점수"
            metric="health"
            aDisplay={`${channelA.health.totalScore}점`}
            bDisplay={`${channelB.health.totalScore}점`}
            aValue={channelA.health.totalScore}
            bValue={channelB.health.totalScore}
          />
          <MetricRow
            label="예상 월수익"
            metric="revenue"
            aDisplay={`$${channelA.revenue.min.toLocaleString()}~${channelA.revenue.max.toLocaleString()}`}
            bDisplay={`$${channelB.revenue.min.toLocaleString()}~${channelB.revenue.max.toLocaleString()}`}
            aValue={channelA.revenue.max}
            bValue={channelB.revenue.max}
          />
        </CardContent>
      </Card>

      {/* 건강도 레이더 오버레이 */}
      <Card>
        <CardContent className="p-5">
          <h3 className="mb-2 inline-flex items-center gap-1 font-semibold">
            건강도 세부 비교 <MetricInfo metric="healthBreakdown" />
          </h3>
          <HealthRadarChart
            dataA={channelA.health.breakdown}
            labelA={channelA.stats.channelTitle || "채널 A"}
            dataB={channelB.health.breakdown}
            labelB={channelB.stats.channelTitle || "채널 B"}
            height={280}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
