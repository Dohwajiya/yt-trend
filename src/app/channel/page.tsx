/**
 * 채널 찾기 페이지
 * 키워드 검색 결과의 영상들에서 채널을 그룹화하여
 * 채널별 평균 반응도, 영상 수, 구독자 수를 분석
 */

"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import ReactionBadge from "@/components/search/reaction-badge";
import { formatNumber, formatRelativeDate } from "@/lib/format";
import { calculateReaction } from "@/lib/reaction";
import type { EnrichedVideo, ChannelAnalysis } from "@/types/analysis";
import type { SearchApiResponse } from "@/types/analysis";

/** 검색 결과에서 채널별로 그룹화하여 분석 데이터를 생성 */
function analyzeChannels(videos: EnrichedVideo[]): ChannelAnalysis[] {
  // 채널 ID별로 영상 그룹화
  const channelMap = new Map<string, EnrichedVideo[]>();
  for (const video of videos) {
    const existing = channelMap.get(video.channelId) ?? [];
    existing.push(video);
    channelMap.set(video.channelId, existing);
  }

  // 채널별 분석 데이터 생성
  const analyses: ChannelAnalysis[] = [];
  for (const [channelId, channelVideos] of channelMap) {
    const first = channelVideos[0];
    const totalRatio = channelVideos.reduce(
      (sum, v) => sum + v.reaction.ratio,
      0
    );
    const avgRatio = totalRatio / channelVideos.length;
    const avgReaction = calculateReaction(
      avgRatio * first.subscriberCount,
      first.subscriberCount
    );

    // 최신 게시일 찾기
    const latestDate = channelVideos.reduce((latest, v) =>
      new Date(v.publishedAt) > new Date(latest.publishedAt) ? v : latest
    );

    analyses.push({
      channelId,
      channelTitle: first.channelTitle,
      channelThumbnailUrl: first.channelThumbnailUrl,
      subscriberCount: first.subscriberCount,
      videoCount: channelVideos.length,
      avgReactionRatio: avgRatio,
      avgReactionGrade: avgReaction.grade,
      latestPublishedAt: latestDate.publishedAt,
    });
  }

  // 평균 반응도 비율 높은 순으로 정렬
  return analyses.sort((a, b) => b.avgReactionRatio - a.avgReactionRatio);
}

/** 내부 채널 찾기 컴포넌트 */
function ChannelContent() {
  const searchParams = useSearchParams();
  const initialKeyword = searchParams.get("q") ?? "";

  const [keyword, setKeyword] = useState(initialKeyword);
  const [channels, setChannels] = useState<ChannelAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** 키워드 검색 실행 → 결과에서 채널 그룹화 */
  const handleSearch = async () => {
    const trimmed = keyword.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError(null);
    setChannels([]);

    try {
      // 최대 50개 영상 검색하여 채널 분석
      const response = await fetch("/api/youtube/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: trimmed, maxResults: 50 }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "검색에 실패했습니다.");
      }

      const data: SearchApiResponse = await response.json();
      const analyzed = analyzeChannels(data.items);
      setChannels(analyzed);

      // URL 업데이트
      window.history.pushState(
        null,
        "",
        `/channel?q=${encodeURIComponent(trimmed)}`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "오류가 발생했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-6">
      {/* 검색 바 */}
      <div className="flex gap-2">
        <Input
          placeholder="키워드를 입력하세요 (예: 캠핑)"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-10 bg-secondary/50 border-border/50"
        />
        <Button onClick={handleSearch} disabled={isLoading || !keyword.trim()}>
          {isLoading ? "분석 중..." : "채널 분석"}
        </Button>
      </div>

      {/* 에러 */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* 로딩 스켈레톤 */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/5" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      )}

      {/* 채널 결과 테이블 */}
      {!isLoading && channels.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">
            {channels.length}개 채널 발견 (반응도 높은 순)
          </p>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>채널</TableHead>
                <TableHead className="w-[100px] text-right">구독자</TableHead>
                <TableHead className="w-[80px] text-center">영상 수</TableHead>
                <TableHead className="w-[100px] text-center">
                  평균 반응도
                </TableHead>
                <TableHead className="w-[100px] text-right">최신 게시일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channels.map((ch) => (
                <TableRow key={ch.channelId} className="hover:bg-secondary/30">
                  <TableCell>
                    <Link
                      href={`/channel/${ch.channelId}`}
                      className="flex items-center gap-2 hover:text-primary"
                    >
                      {ch.channelThumbnailUrl && (
                        <Image
                          src={ch.channelThumbnailUrl}
                          alt={ch.channelTitle}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      )}
                      <span className="font-medium">{ch.channelTitle}</span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {ch.subscriberCount > 0
                      ? formatNumber(ch.subscriberCount)
                      : "-"}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {ch.videoCount}
                  </TableCell>
                  <TableCell className="text-center">
                    <ReactionBadge
                      grade={ch.avgReactionGrade}
                      ratio={ch.avgReactionRatio}
                      subscriberCount={ch.subscriberCount}
                    />
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {formatRelativeDate(ch.latestPublishedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      {/* 결과 없음 */}
      {!isLoading && channels.length === 0 && !error && initialKeyword && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-lg">키워드를 입력하고 채널을 분석해보세요</p>
        </div>
      )}
    </div>
  );
}

export default function ChannelPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <ChannelContent />
    </Suspense>
  );
}
