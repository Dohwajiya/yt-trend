/**
 * 대시보드 페이지 (메인)
 * 최근 검색 히스토리, 한국/해외 트렌딩 미리보기를 한 눈에 표시
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Flame, TrendingUp } from "lucide-react";
import { useHistoryStore } from "@/stores/history-store";
import { formatNumber, formatRelativeDate } from "@/lib/format";
import type { EnrichedVideo, SearchApiResponse } from "@/types/analysis";

export default function DashboardPage() {
  const router = useRouter();
  const { searches } = useHistoryStore();
  const [trendingKR, setTrendingKR] = useState<EnrichedVideo[]>([]);
  const [trendingUS, setTrendingUS] = useState<EnrichedVideo[]>([]);
  const [loadingKR, setLoadingKR] = useState(true);
  const [loadingUS, setLoadingUS] = useState(true);

  // 한국 + 해외(미국) 트렌딩 병렬 로드
  useEffect(() => {
    async function fetchTrending(region: string) {
      const res = await fetch(`/api/youtube/trending?regionCode=${region}&maxResults=6`);
      if (res.ok) {
        const data: SearchApiResponse = await res.json();
        return data.items;
      }
      return [];
    }

    fetchTrending("KR")
      .then(setTrendingKR)
      .catch(() => {})
      .finally(() => setLoadingKR(false));

    fetchTrending("US")
      .then(setTrendingUS)
      .catch(() => {})
      .finally(() => setLoadingUS(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      {/* 상단 요약 카드 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={<Search className="h-5 w-5" />}
          label="최근 검색"
          value={`${searches.length}회`}
          sub="누적 검색 히스토리"
          href="/search"
        />
        <SummaryCard
          icon={<Flame className="h-5 w-5" />}
          label="트렌딩"
          value={`${trendingKR.length + trendingUS.length}개`}
          sub="한국 + 해외 인기 영상"
          href="/trending"
        />
        <SummaryCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="키워드 분석"
          value="무제한"
          sub="연관 키워드 + 경쟁도"
          href="/keywords"
        />
      </div>

      {/* 최근 검색 히스토리 */}
      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">최근 검색 키워드</h2>
            <Link
              href="/search"
              className="text-xs text-primary hover:underline"
            >
              영상 찾기 →
            </Link>
          </div>
          {searches.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              아직 검색 기록이 없습니다.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {searches.slice(0, 10).map((s) => (
                <button
                  key={s.keyword + s.timestamp}
                  onClick={() =>
                    router.push(`/search?q=${encodeURIComponent(s.keyword)}`)
                  }
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-secondary/50"
                >
                  <span className="font-medium">{s.keyword}</span>
                  <span className="text-xs text-muted-foreground">
                    {s.resultCount.toLocaleString()}건 ·{" "}
                    {formatRelativeDate(s.timestamp)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 한국 트렌딩 */}
      <TrendingSection
        title="한국 트렌딩 영상"
        videos={trendingKR}
        loading={loadingKR}
        region="KR"
      />

      {/* 해외(미국) 트렌딩 */}
      <TrendingSection
        title="해외 트렌딩 영상 (US)"
        videos={trendingUS}
        loading={loadingUS}
        region="US"
      />
    </div>
  );
}

/** 트렌딩 섹션 컴포넌트 (한국/해외 공용) */
function TrendingSection({
  title,
  videos,
  loading,
  region,
}: {
  title: string;
  videos: EnrichedVideo[];
  loading: boolean;
  region: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">{title}</h2>
          <Link
            href={`/trending?region=${region}`}
            className="text-xs text-primary hover:underline"
          >
            더 보기 →
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-video w-full rounded" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v) => (
              <a
                key={v.videoId}
                href={`https://youtube.com/watch?v=${v.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-lg border border-border/50 p-3 transition-colors hover:border-primary/30"
              >
                <div className="relative aspect-video w-full overflow-hidden rounded">
                  <Image
                    src={v.thumbnailUrl}
                    alt={v.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <p className="mt-2 line-clamp-2 text-sm font-medium group-hover:text-primary">
                  {v.title}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {v.channelTitle}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    · {formatNumber(v.viewCount)} 조회
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      v.reaction.grade === "Good"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]"
                        : v.reaction.grade === "Bad"
                          ? "bg-red-500/20 text-red-400 border-red-500/30 text-[10px]"
                          : "bg-gray-500/20 text-gray-400 border-gray-500/30 text-[10px]"
                    }
                  >
                    {v.reaction.grade}
                  </Badge>
                </div>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** 상단 요약 카드 컴포넌트 */
function SummaryCard({
  icon,
  label,
  value,
  sub,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="transition-colors hover:border-primary/30">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="rounded-md bg-primary/10 p-2 text-primary">
            {icon}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-bold">{value}</p>
            <p className="text-[10px] text-muted-foreground">{sub}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
