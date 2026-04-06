/**
 * 채널 분석 상세 페이지
 * 건강도 점수, 예상 수익, 반응도 차트, 최근 영상 목록
 */

"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import ReactionBadge from "@/components/search/reaction-badge";
import ReactionPieChart from "@/components/charts/reaction-pie-chart";
import HealthRadarChart from "@/components/charts/health-radar-chart";
import {
  formatNumber,
  formatRelativeDate,
  formatDuration,
} from "@/lib/format";
import { calculateReactionDistribution } from "@/lib/keyword-analysis";
import { cn } from "@/lib/utils";
import type {
  EnrichedVideo,
  ChannelDetailStats,
  ChannelHealthResult,
  RevenueEstimate,
} from "@/types/analysis";

/** 채널 영상 정렬 기준 */
type ChannelSortBy = "date" | "viewCount" | "reaction";

interface ChannelApiResponse {
  items: EnrichedVideo[];
  channelStats: ChannelDetailStats | null;
  health: ChannelHealthResult;
  revenue: RevenueEstimate;
  monthlyViews: number;
  nextPageToken: string | null;
  totalResults: number;
}

interface ChannelDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ChannelDetailPage({ params }: ChannelDetailPageProps) {
  const { id: channelId } = use(params);
  const [data, setData] = useState<ChannelApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<ChannelSortBy>("date");

  useEffect(() => {
    async function fetchChannel() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/youtube/channels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channelId, maxResults: 30 }),
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error ?? "채널 정보를 가져올 수 없습니다.");
        }
        const result: ChannelApiResponse = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchChannel();
  }, [channelId]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error ?? "데이터를 불러올 수 없습니다."}
        </div>
        <Link href="/channel" className="mt-4 inline-block">
          <Button variant="outline">채널 찾기로 돌아가기</Button>
        </Link>
      </div>
    );
  }

  const { items: videos, channelStats, health, revenue, monthlyViews } = data;
  const distribution = calculateReactionDistribution(videos);
  const channelInfo = videos[0];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      {/* 채널 헤더 */}
      {(channelStats || channelInfo) && (
        <div className="flex items-center gap-4">
          {(channelStats?.channelThumbnailUrl || channelInfo?.channelThumbnailUrl) && (
            <Image
              src={channelStats?.channelThumbnailUrl || channelInfo?.channelThumbnailUrl || ""}
              alt={channelStats?.channelTitle || channelInfo?.channelTitle || ""}
              width={64}
              height={64}
              className="rounded-full"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold">
              {channelStats?.channelTitle || channelInfo?.channelTitle}
            </h1>
            <p className="text-sm text-muted-foreground">
              구독자{" "}
              {formatNumber(channelStats?.subscriberCount ?? channelInfo?.subscriberCount ?? 0)}
              {channelStats && (
                <span>
                  {" "}· 총 영상 {formatNumber(channelStats.totalVideoCount)}개
                  · 총 조회수 {formatNumber(channelStats.totalViewCount)}
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* 핵심 지표 카드 */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {/* 건강도 점수 */}
        <Card>
          <CardContent className="flex flex-col items-center p-4">
            <p className="text-xs text-muted-foreground">채널 건강도</p>
            <div className="relative my-2 flex h-20 w-20 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="none" stroke="hsl(220 10% 20%)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="38" fill="none"
                  stroke={health.totalScore >= 60 ? "#34d399" : health.totalScore >= 30 ? "#fbbf24" : "#f87171"}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${health.totalScore * 2.39} 239`}
                />
              </svg>
              <span className="absolute text-xl font-bold">{health.totalScore}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">/ 100</p>
          </CardContent>
        </Card>

        {/* 예상 월 수익 */}
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">예상 월 수익</p>
            <p className="mt-2 text-xl font-bold">
              ${revenue.min.toLocaleString()} ~ ${revenue.max.toLocaleString()}
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              월 조회수 {formatNumber(monthlyViews)} 기준 (CPM $1~$5)
            </p>
          </CardContent>
        </Card>

        {/* 평균 반응도 */}
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">평균 반응도</p>
            <p className="mt-2 text-xl font-bold">
              {videos.length > 0
                ? (
                    (videos.reduce((s, v) => s + v.reaction.ratio, 0) /
                      videos.length) *
                    100
                  ).toFixed(1)
                : "0"}
              %
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              분석 영상 {videos.length}개 기준
            </p>
          </CardContent>
        </Card>

        {/* 반응도 분포 */}
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">반응도 분포</p>
            <p className="mt-2 text-xl font-bold">
              {distribution.good} / {distribution.normal} / {distribution.bad}
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Good / Normal / Bad
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <h3 className="mb-2 font-semibold">건강도 세부 항목</h3>
            <HealthRadarChart
              dataA={health.breakdown}
              labelA={channelStats?.channelTitle || "채널"}
              height={220}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h3 className="mb-2 font-semibold">반응도 분포</h3>
            <ReactionPieChart distribution={distribution} height={220} />
          </CardContent>
        </Card>
      </div>

      {/* 최근 영상 테이블 */}
      {videos.length > 0 && (() => {
        // 정렬 적용
        const sortedVideos = [...videos].sort((a, b) => {
          switch (sortBy) {
            case "viewCount":
              return b.viewCount - a.viewCount;
            case "reaction":
              return b.reaction.ratio - a.reaction.ratio;
            case "date":
            default:
              return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
          }
        });

        return (
          <>
            {/* 정렬 버튼 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">정렬:</span>
              <div className="flex rounded-md border border-border/50">
                {([
                  { value: "date" as ChannelSortBy, label: "최신순" },
                  { value: "viewCount" as ChannelSortBy, label: "조회수순" },
                  { value: "reaction" as ChannelSortBy, label: "반응도순" },
                ]).map((opt) => (
                  <Button
                    key={opt.value}
                    variant="ghost"
                    size="sm"
                    onClick={() => setSortBy(opt.value)}
                    className={cn(
                      "rounded-none border-r border-border/50 last:border-r-0 px-3 h-8 text-xs",
                      sortBy === opt.value
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
              <span className="ml-auto text-xs text-muted-foreground">
                분석 {videos.length}개 / 총 {formatNumber(channelStats?.totalVideoCount ?? 0)}개 영상
              </span>
            </div>

            <div className="overflow-x-auto">
              <Table className="min-w-[750px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-10 text-center">#</TableHead>
                    <TableHead className="w-[130px]">썸네일</TableHead>
                    <TableHead>제목</TableHead>
                    <TableHead className="w-[90px] text-right">조회수</TableHead>
                    <TableHead className="w-[80px] text-center">반응도</TableHead>
                    <TableHead className="w-[90px] text-right">게시일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedVideos.map((video, index) => (
                    <TableRow key={video.videoId} className="hover:bg-secondary/30">
                      <TableCell className="text-center text-sm font-bold text-primary">
                        {index + 1}
                      </TableCell>
                      <TableCell className="p-2">
                        <a
                          href={`https://youtube.com/watch?v=${video.videoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative block aspect-video w-[110px] overflow-hidden rounded"
                        >
                          <Image
                            src={video.thumbnailUrl}
                            alt={video.title}
                            fill
                            className="object-cover"
                            sizes="110px"
                          />
                          <span className="absolute bottom-0.5 right-0.5 rounded bg-black/80 px-1 py-0.5 text-[10px] text-white">
                            {formatDuration(video.duration)}
                          </span>
                        </a>
                      </TableCell>
                      <TableCell>
                        <a
                          href={`https://youtube.com/watch?v=${video.videoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="line-clamp-2 text-sm font-medium hover:text-primary"
                        >
                          {video.title}
                        </a>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatNumber(video.viewCount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <ReactionBadge
                          grade={video.reaction.grade}
                          ratio={video.reaction.ratio}
                          subscriberCount={video.subscriberCount}
                        />
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {formatRelativeDate(video.publishedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        );
      })()}
    </div>
  );
}
