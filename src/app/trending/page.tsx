/**
 * 트렌딩 페이지
 * 카테고리별/국가별 YouTube 인기 영상 그리드
 * 최대 100개, 기간 필터링 지원
 */

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import ReactionBadge from "@/components/search/reaction-badge";
import { formatNumber, formatRelativeDate, formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EnrichedVideo, SearchApiResponse } from "@/types/analysis";

/** YouTube 카테고리 목록 */
const CATEGORIES = [
  { id: "0", label: "전체" },
  { id: "10", label: "음악" },
  { id: "20", label: "게임" },
  { id: "24", label: "엔터테인먼트" },
  { id: "27", label: "교육" },
  { id: "17", label: "스포츠" },
  { id: "25", label: "뉴스" },
  { id: "28", label: "과학기술" },
  { id: "22", label: "인물/블로그" },
  { id: "26", label: "노하우/스타일" },
];

const REGIONS = [
  { value: "KR", label: "한국" },
  { value: "US", label: "미국" },
  { value: "JP", label: "일본" },
  { value: "GB", label: "영국" },
];

/** 기간 필터 (트렌딩 결과를 업로드 날짜로 필터링) */
type TrendingDateFilter = "all" | "1d" | "1w" | "1m" | "3m" | "6m" | "1y";

const DATE_FILTERS: { value: TrendingDateFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "1d", label: "1일" },
  { value: "1w", label: "1주일" },
  { value: "1m", label: "1개월" },
  { value: "3m", label: "3개월" },
  { value: "6m", label: "6개월" },
  { value: "1y", label: "1년" },
];

function getDateThreshold(filter: TrendingDateFilter): Date | null {
  if (filter === "all") return null;
  const now = new Date();
  switch (filter) {
    case "1d": now.setDate(now.getDate() - 1); break;
    case "1w": now.setDate(now.getDate() - 7); break;
    case "1m": now.setMonth(now.getMonth() - 1); break;
    case "3m": now.setMonth(now.getMonth() - 3); break;
    case "6m": now.setMonth(now.getMonth() - 6); break;
    case "1y": now.setFullYear(now.getFullYear() - 1); break;
  }
  return now;
}

export default function TrendingPage() {
  const [regionCode, setRegionCode] = useState("KR");
  const [categoryId, setCategoryId] = useState("0");
  const [dateFilter, setDateFilter] = useState<TrendingDateFilter>("all");
  const [videos, setVideos] = useState<EnrichedVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /** 트렌딩 영상 가져오기 (최대 50개씩 2번 = 100개) */
  const fetchTrending = async (region: string, category: string) => {
    setIsLoading(true);
    try {
      // YouTube API는 한 번에 최대 50개까지만 가능하므로 50개 요청
      // (mostPopular 차트는 pageToken을 지원하지 않으므로 50개가 최대)
      const res = await fetch(
        `/api/youtube/trending?regionCode=${region}&categoryId=${category}&maxResults=50`
      );
      if (res.ok) {
        const data: SearchApiResponse = await res.json();
        setVideos(data.items);
      }
    } catch {
      // 실패 무시
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrending(regionCode, categoryId);
  }, [regionCode, categoryId]);

  // 기간 필터 적용
  const threshold = getDateThreshold(dateFilter);
  const filteredVideos = threshold
    ? videos.filter((v) => new Date(v.publishedAt) >= threshold)
    : videos;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      {/* 필터 1행: 카테고리 + 지역 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              variant="ghost"
              size="sm"
              onClick={() => setCategoryId(cat.id)}
              className={cn(
                "h-8 px-3 text-xs",
                categoryId === cat.id
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground"
              )}
            >
              {cat.label}
            </Button>
          ))}
        </div>

        <Select value={regionCode} onValueChange={(val) => { if (val) setRegionCode(val); }}>
          <SelectTrigger className="h-8 w-24 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REGIONS.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 필터 2행: 기간 필터 + 결과 수 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-md border border-border/50">
          {DATE_FILTERS.map((f) => (
            <Button
              key={f.value}
              variant="ghost"
              size="sm"
              onClick={() => setDateFilter(f.value)}
              className={cn(
                "rounded-none border-r border-border/50 last:border-r-0 px-2 h-8 text-xs",
                dateFilter === f.value
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground"
              )}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <span className="text-sm text-muted-foreground">
          {filteredVideos.length}개 영상
        </span>
      </div>

      {/* 로딩 스켈레톤 */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-video w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* 트렌딩 영상 그리드 */}
      {!isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filteredVideos.map((v, i) => (
            <a
              key={v.videoId}
              href={`https://youtube.com/watch?v=${v.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-lg border border-border/50 bg-card transition-colors hover:border-primary/30"
            >
              <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                <Image
                  src={v.thumbnailUrl}
                  alt={v.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <span className="absolute left-1.5 top-1.5 rounded bg-black/80 px-1.5 py-0.5 text-xs font-bold text-white">
                  #{i + 1}
                </span>
                <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[10px] text-white">
                  {formatDuration(v.duration)}
                </span>
              </div>
              <div className="p-3">
                <p className="line-clamp-2 text-sm font-medium group-hover:text-primary">
                  {v.title}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  {v.channelThumbnailUrl && (
                    <Image
                      src={v.channelThumbnailUrl}
                      alt={v.channelTitle}
                      width={16}
                      height={16}
                      className="rounded-full"
                    />
                  )}
                  <span className="truncate text-xs text-muted-foreground">
                    {v.channelTitle}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatNumber(v.viewCount)} 조회
                  </span>
                  <span className="text-xs text-muted-foreground">
                    · {formatRelativeDate(v.publishedAt)}
                  </span>
                </div>
                <div className="mt-1.5">
                  <ReactionBadge
                    grade={v.reaction.grade}
                    ratio={v.reaction.ratio}
                    subscriberCount={v.subscriberCount}
                  />
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {!isLoading && filteredVideos.length === 0 && (
        <div className="py-20 text-center text-muted-foreground">
          해당 조건의 트렌딩 영상이 없습니다.
        </div>
      )}
    </div>
  );
}
