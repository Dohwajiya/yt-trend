/**
 * 트렌딩 페이지
 * 카테고리별/국가별 YouTube 인기 영상 그리드
 */

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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

export default function TrendingPage() {
  const [regionCode, setRegionCode] = useState("KR");
  const [categoryId, setCategoryId] = useState("0");
  const [videos, setVideos] = useState<EnrichedVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /** 트렌딩 영상 가져오기 */
  const fetchTrending = async (region: string, category: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/youtube/trending?regionCode=${region}&categoryId=${category}&maxResults=20`
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

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      {/* 필터 */}
      <div className="flex flex-wrap items-center gap-3">
        {/* 카테고리 버튼 그룹 */}
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

        {/* 지역 선택 */}
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
          {videos.map((v, i) => (
            <a
              key={v.videoId}
              href={`https://youtube.com/watch?v=${v.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-lg border border-border/50 bg-card transition-colors hover:border-primary/30"
            >
              {/* 썸네일 */}
              <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                <Image
                  src={v.thumbnailUrl}
                  alt={v.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                {/* 순위 배지 */}
                <span className="absolute left-1.5 top-1.5 rounded bg-black/80 px-1.5 py-0.5 text-xs font-bold text-white">
                  #{i + 1}
                </span>
                {/* 길이 */}
                <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[10px] text-white">
                  {formatDuration(v.duration)}
                </span>
              </div>

              {/* 정보 */}
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

      {!isLoading && videos.length === 0 && (
        <div className="py-20 text-center text-muted-foreground">
          트렌딩 영상을 불러올 수 없습니다.
        </div>
      )}
    </div>
  );
}
