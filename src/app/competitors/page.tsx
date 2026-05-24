/**
 * 경쟁 채널 추적 페이지
 * 유사 크리에이터를 워치리스트(localStorage)에 등록하고, 호출 시점 통계를
 * 정렬 가능한 표로 벤치마킹한다. 2개 채널을 선택해 헤드투헤드 비교로 이동한다.
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Plus, Check, Swords } from "lucide-react";
import CompetitorTable from "@/components/competitors/competitor-table";
import { useCompetitorStore } from "@/stores/competitor-store";
import { formatNumber } from "@/lib/format";
import type { ChannelSearchResult } from "@/lib/youtube-api";
import type { CompetitorSnapshot } from "@/types/analysis";

export default function CompetitorsPage() {
  const router = useRouter();
  const { channels, addChannel, removeChannel } = useCompetitorStore();

  // 하이드레이션 불일치 방지용 마운트 가드 (persist 스토어)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // 채널 검색(추가) 상태
  const [searchKw, setSearchKw] = useState("");
  const [searchResults, setSearchResults] = useState<ChannelSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // 워치리스트 통계 상태
  const [snapshots, setSnapshots] = useState<CompetitorSnapshot[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // 비교 선택 상태 (최대 2개)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 채널 ID 목록을 문자열 키로 (useEffect 의존성용)
  const channelIdsKey = channels.map((c) => c.channelId).join(",");

  /** 워치리스트 채널들의 경량 통계를 배치로 조회 */
  const fetchSnapshots = useCallback(async (ids: string[]) => {
    if (ids.length === 0) {
      setSnapshots([]);
      return;
    }
    setStatsLoading(true);
    setStatsError(null);
    try {
      const res = await fetch("/api/youtube/channels/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelIds: ids }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "통계를 불러올 수 없습니다.");
      }
      const data = await res.json();
      setSnapshots(data.snapshots ?? []);
    } catch (err) {
      setStatsError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // 워치리스트가 바뀌면 통계 재조회
  useEffect(() => {
    if (!mounted) return;
    fetchSnapshots(channelIdsKey ? channelIdsKey.split(",") : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelIdsKey, mounted]);

  /** 채널 검색 실행 */
  const handleSearch = async () => {
    const trimmed = searchKw.trim();
    if (!trimmed) return;
    setSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(
        `/api/youtube/channel-search?q=${encodeURIComponent(trimmed)}`
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "검색에 실패했습니다.");
      }
      const data = await res.json();
      setSearchResults(data.channels ?? []);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setSearching(false);
    }
  };

  /** 비교 대상 선택 토글 (최대 2개) */
  const toggleSelect = (channelId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(channelId)) {
        next.delete(channelId);
      } else if (next.size < 2) {
        next.add(channelId);
      }
      return next;
    });
  };

  /** 2개 선택 시 비교 페이지로 이동 */
  const goCompare = () => {
    const [a, b] = [...selectedIds];
    if (a && b) router.push(`/compare?a=${a}&b=${b}`);
  };

  const watchedIds = useMemo(
    () => new Set(channels.map((c) => c.channelId)),
    [channels]
  );

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-6">
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <Eye className="h-5 w-5 text-primary" />
        <div>
          <h1 className="text-lg font-bold">경쟁 채널 추적</h1>
          <p className="text-xs text-muted-foreground">
            유사 채널을 워치리스트에 등록해 통계를 벤치마킹하세요. (호출 시점 기준)
          </p>
        </div>
      </div>

      {/* 채널 검색(추가) */}
      <div className="space-y-3 rounded-lg border border-border/50 bg-card p-4">
        <p className="text-sm font-semibold">채널 추가</p>
        <div className="flex gap-2">
          <Input
            placeholder="채널명 또는 키워드 검색 (예: 짐풀기, 챌린지)"
            value={searchKw}
            onChange={(e) => setSearchKw(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="h-9 bg-secondary/50 border-border/50"
          />
          <Button onClick={handleSearch} disabled={searching || !searchKw.trim()} size="sm">
            {searching ? "검색 중..." : "검색"}
          </Button>
        </div>

        {searchError && (
          <p className="text-xs text-destructive">{searchError}</p>
        )}

        {searchResults.length > 0 && (
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {searchResults.map((ch) => {
              const added = watchedIds.has(ch.channelId);
              return (
                <div
                  key={ch.channelId}
                  className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-secondary/50"
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
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{ch.channelTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      구독 {ch.subscriberCount > 0 ? formatNumber(ch.subscriberCount) : "비공개"}
                      {" · "}영상 {formatNumber(ch.totalVideoCount)}
                    </p>
                  </div>
                  <Button
                    variant={added ? "ghost" : "outline"}
                    size="sm"
                    disabled={added}
                    onClick={() =>
                      addChannel({
                        channelId: ch.channelId,
                        channelTitle: ch.channelTitle,
                        channelThumbnailUrl: ch.channelThumbnailUrl,
                      })
                    }
                    className="h-7 shrink-0 text-xs"
                  >
                    {added ? (
                      <>
                        <Check className="mr-1 h-3 w-3" /> 추가됨
                      </>
                    ) : (
                      <>
                        <Plus className="mr-1 h-3 w-3" /> 추가
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 워치리스트 (마운트 후에만 렌더) */}
      {mounted && (
        <>
          {channels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <Eye className="mb-3 h-10 w-10 text-primary/40" />
              <p className="text-lg">추적 중인 경쟁 채널이 없어요</p>
              <p className="mt-1 text-sm">위에서 채널을 검색해 워치리스트에 추가하세요.</p>
            </div>
          ) : (
            <>
              {/* 상단 액션 바 */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">
                  워치리스트 {channels.length}개
                </span>
                <span className="text-xs text-muted-foreground">
                  · 비교할 채널 2개를 선택하세요
                </span>
                <div className="ml-auto flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      fetchSnapshots(channels.map((c) => c.channelId))
                    }
                    disabled={statsLoading}
                  >
                    {statsLoading ? "갱신 중..." : "새로고침"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={goCompare}
                    disabled={selectedIds.size !== 2}
                  >
                    <Swords className="mr-1 h-4 w-4" />
                    비교하기 ({selectedIds.size}/2)
                  </Button>
                </div>
              </div>

              {statsError && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                  {statsError}
                </div>
              )}

              {/* 통계 표 */}
              {statsLoading && snapshots.length === 0 ? (
                <div className="space-y-2">
                  {Array.from({ length: channels.length }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded" />
                  ))}
                </div>
              ) : (
                <CompetitorTable
                  snapshots={snapshots}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  selectionFull={selectedIds.size >= 2}
                  onRemove={(id) => {
                    removeChannel(id);
                    setSelectedIds((prev) => {
                      const next = new Set(prev);
                      next.delete(id);
                      return next;
                    });
                  }}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
