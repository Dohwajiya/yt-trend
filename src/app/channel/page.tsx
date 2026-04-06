/**
 * 채널 분석 페이지
 * 키워드로 채널을 직접 검색(type=channel)하여 채널 목록 표시
 * 클릭 시 채널 상세 분석 페이지로 이동
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
import { formatNumber } from "@/lib/format";
import ReactionBadge from "@/components/search/reaction-badge";
import { calculateReaction } from "@/lib/reaction";
import type { ChannelSearchResult } from "@/lib/youtube-api";

/** 내부 채널 찾기 컴포넌트 */
function ChannelContent() {
  const searchParams = useSearchParams();
  const initialKeyword = searchParams.get("q") ?? "";

  const [keyword, setKeyword] = useState(initialKeyword);
  const [channels, setChannels] = useState<ChannelSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  /** 채널 직접 검색 실행 */
  const handleSearch = async () => {
    const trimmed = keyword.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError(null);
    setChannels([]);
    setSearched(true);

    try {
      const response = await fetch(
        `/api/youtube/channel-search?q=${encodeURIComponent(trimmed)}`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "검색에 실패했습니다.");
      }

      const data = await response.json();
      setChannels(data.channels ?? []);

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
          placeholder="채널명 또는 키워드를 입력하세요 (예: 설레신, 캠핑)"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-10 bg-secondary/50 border-border/50"
        />
        <Button onClick={handleSearch} disabled={isLoading || !keyword.trim()}>
          {isLoading ? "검색 중..." : "채널 검색"}
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
            </div>
          ))}
        </div>
      )}

      {/* 채널 결과 테이블 */}
      {!isLoading && channels.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">
            {channels.length}개 채널 발견
          </p>
          <div className="overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10 text-center">#</TableHead>
                  <TableHead>채널</TableHead>
                  <TableHead className="w-[100px] text-right">구독자</TableHead>
                  <TableHead className="w-[100px] text-right">총 조회수</TableHead>
                  <TableHead className="w-[80px] text-right">영상 수</TableHead>
                  <TableHead className="w-[100px] text-center">평균 반응도</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channels.map((ch, index) => (
                  <TableRow key={ch.channelId} className="hover:bg-secondary/30">
                    <TableCell className="text-center text-sm font-bold text-primary">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/channel/${ch.channelId}`}
                        className="flex items-center gap-3 hover:text-primary"
                      >
                        {ch.channelThumbnailUrl && (
                          <Image
                            src={ch.channelThumbnailUrl}
                            alt={ch.channelTitle}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        )}
                        <div>
                          <p className="font-medium">{ch.channelTitle}</p>
                          {ch.description && (
                            <p className="text-xs text-muted-foreground">
                              {ch.description.length > 20
                                ? ch.description.slice(0, 20) + "…"
                                : ch.description}
                            </p>
                          )}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {ch.subscriberCount > 0
                        ? formatNumber(ch.subscriberCount)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatNumber(ch.totalViewCount)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatNumber(ch.totalVideoCount)}
                    </TableCell>
                    <TableCell className="text-center">
                      {ch.subscriberCount > 0 && ch.totalVideoCount > 0 ? (
                        <ReactionBadge
                          grade={calculateReaction(
                            Math.round(ch.totalViewCount / ch.totalVideoCount),
                            ch.subscriberCount
                          ).grade}
                          ratio={calculateReaction(
                            Math.round(ch.totalViewCount / ch.totalVideoCount),
                            ch.subscriberCount
                          ).ratio}
                          subscriberCount={ch.subscriberCount}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* 결과 없음 */}
      {!isLoading && searched && channels.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-lg">검색 결과가 없습니다</p>
          <p className="mt-1 text-sm">다른 키워드로 검색해보세요.</p>
        </div>
      )}

      {/* 초기 상태 */}
      {!isLoading && !searched && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-lg">채널명 또는 키워드로 검색하세요</p>
          <p className="mt-1 text-sm">채널을 클릭하면 상세 분석 페이지로 이동합니다.</p>
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
