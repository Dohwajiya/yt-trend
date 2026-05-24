/**
 * 콘텐츠 영감 발굴 페이지
 * 니치 키워드로 영상을 검색해 "구독자 대비 조회수 배수(아웃라이어)"가 높은
 * 떡상 영상을 찾고, 공통 패턴·댓글·썸네일까지 분석해 콘텐츠 기획을 돕는다.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Bookmark, ChevronDown, ChevronRight } from "lucide-react";
import OutlierCard from "@/components/discover/outlier-card";
import PatternInsights from "@/components/discover/pattern-insights";
import CommentsSheet from "@/components/discover/comments-sheet";
import ThumbnailLightbox from "@/components/discover/thumbnail-lightbox";
import MetricInfo from "@/components/ui/metric-info";
import { useReferenceStore } from "@/stores/reference-store";
import { useSettingsStore } from "@/stores/settings-store";
import { NICHE_PRESETS } from "@/lib/niche-presets";
import { REGIONS, regionTargetLang } from "@/lib/regions";
import {
  getOutlierMultiplier,
  getOutlierTier,
  formatMultiplier,
} from "@/lib/outlier";
import { analyzeOutlierPatterns } from "@/lib/pattern-analysis";
import { cn } from "@/lib/utils";
import type { EnrichedVideo, SearchApiResponse } from "@/types/analysis";

/** 최소 배수 필터 옵션 */
const multiplierFilters = [
  { value: "all", label: "전체" },
  { value: "1", label: "≥ 1x" },
  { value: "3", label: "🔥 ≥ 3x" },
  { value: "10", label: "🚀 ≥ 10x" },
];

/** 영상 타입 필터 옵션 */
const typeFilters = [
  { value: "all", label: "전체" },
  { value: "regular", label: "일반" },
  { value: "shorts", label: "쇼츠" },
];

/** 기간 필터 옵션 */
const dateFilters = [
  { value: "all", label: "전체 기간" },
  { value: "1w", label: "1주일" },
  { value: "1m", label: "1개월" },
  { value: "3m", label: "3개월" },
  { value: "6m", label: "6개월" },
  { value: "1y", label: "1년" },
  { value: "2y", label: "2년" },
  { value: "3y", label: "3년" },
];

/** 최소 구독자 필터 옵션 */
const subFilters = [
  { value: "0", label: "전체" },
  { value: "1000", label: "1천+" },
  { value: "10000", label: "1만+" },
  { value: "100000", label: "10만+" },
  { value: "1000000", label: "100만+" },
];

/** 최소 조회수 필터 옵션 */
const viewFilters = [
  { value: "0", label: "전체" },
  { value: "10000", label: "1만+" },
  { value: "100000", label: "10만+" },
  { value: "1000000", label: "100만+" },
];

/** 정렬 모드 */
const sortModes: { value: "multiplier" | "views"; label: string }[] = [
  { value: "multiplier", label: "배수순" },
  { value: "views", label: "조회수순" },
];

/** 뷰 모드 */
const viewModes: { value: "card" | "thumb"; label: string }[] = [
  { value: "card", label: "카드" },
  { value: "thumb", label: "썸네일" },
];

/** 딥 스캔에 사용할 키워드 (각 프리셋 그룹 대표 1개) */
const DEEP_SCAN_KEYWORDS = NICHE_PRESETS.map((group) => group.keywords[0]);

/** 기간 필터 값에 해당하는 기준 날짜를 반환 */
function getDateThreshold(filter: string): Date | null {
  if (filter === "all") return null;
  const now = new Date();
  if (filter === "1w") now.setDate(now.getDate() - 7);
  else if (filter === "1m") now.setMonth(now.getMonth() - 1);
  else if (filter === "3m") now.setMonth(now.getMonth() - 3);
  else if (filter === "6m") now.setMonth(now.getMonth() - 6);
  else if (filter === "1y") now.setFullYear(now.getFullYear() - 1);
  else if (filter === "2y") now.setFullYear(now.getFullYear() - 2);
  else if (filter === "3y") now.setFullYear(now.getFullYear() - 3);
  return now;
}

/**
 * 국가에 맞춰 검색어를 결정하는 함수
 * 미국/일본이면 한글 키워드를 해당 언어로 번역해 현지 레퍼런스를 검색한다.
 * 번역 실패 시 원문을 그대로 사용한다.
 */
async function resolveSearchTerm(
  keyword: string,
  regionCode: string
): Promise<string> {
  const lang = regionTargetLang(regionCode);
  if (!lang) return keyword; // 한국: 번역 불필요
  try {
    const res = await fetch(
      `/api/translate?q=${encodeURIComponent(keyword)}&target=${lang}`
    );
    if (res.ok) {
      const data = await res.json();
      if (typeof data.translated === "string" && data.translated.trim()) {
        return data.translated.trim();
      }
    }
  } catch {
    // 무시하고 원문 사용
  }
  return keyword;
}

/** 영상 검색 API 호출 (POST /api/youtube/search 재사용) */
async function fetchSearch(
  keyword: string,
  regionCode: string
): Promise<SearchApiResponse> {
  const res = await fetch("/api/youtube/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyword, regionCode, maxResults: 50 }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "검색에 실패했습니다.");
  }
  return res.json();
}

export default function DiscoverPage() {
  const [keyword, setKeyword] = useState("");
  const [regionCode, setRegionCode] = useState("KR");
  const [results, setResults] = useState<EnrichedVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [scanLabel, setScanLabel] = useState<string>("");

  // 필터 상태 (기본 최소 구독자 1천: 의미있는 떡상만)
  const [minMultiplier, setMinMultiplier] = useState("all");
  const [videoType, setVideoType] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [minSubs, setMinSubs] = useState("1000");
  const [minViews, setMinViews] = useState("0");

  // 렌즈 상태
  const [sortMode, setSortMode] = useState<"multiplier" | "views">("multiplier");
  const [viewMode, setViewMode] = useState<"card" | "thumb">("card");
  const [anchorOn, setAnchorOn] = useState(false);

  // 댓글 / 라이트박스
  const [commentsVideo, setCommentsVideo] = useState<EnrichedVideo | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [lightboxVideo, setLightboxVideo] = useState<EnrichedVideo | null>(null);

  // 레퍼런스(스와이프 파일) + 내 채널 설정
  const { videos: savedRefs, clearAll: clearRefs } = useReferenceStore();
  const { myChannelSubscribers, setMyChannelSubscribers } = useSettingsStore();
  const [mounted, setMounted] = useState(false);
  const [showRefs, setShowRefs] = useState(true);
  useEffect(() => setMounted(true), []);

  /** 댓글 시트 열기 */
  const openComments = (v: EnrichedVideo) => {
    setCommentsVideo(v);
    setCommentsOpen(true);
  };

  /** 단일 키워드 검색 (미국/일본이면 자동 번역해 현지 레퍼런스 검색) */
  const runSearch = async (kw: string) => {
    const trimmed = kw.trim();
    if (!trimmed) return;
    setKeyword(trimmed);
    setIsLoading(true);
    setError(null);
    setSearched(true);
    setScanLabel(`"${trimmed}"`);
    try {
      const term = await resolveSearchTerm(trimmed, regionCode);
      // 번역된 경우 무엇으로 검색했는지 표시
      setScanLabel(term === trimmed ? `"${trimmed}"` : `"${trimmed}" → "${term}"`);
      const data = await fetchSearch(term, regionCode);
      setResults(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  /** 딥 스캔: 프리셋 대표 키워드를 순차 검색·병합·중복제거 */
  const runDeepScan = async () => {
    setIsLoading(true);
    setError(null);
    setSearched(true);
    const regionLabel = REGIONS.find((r) => r.value === regionCode)?.label ?? "";
    setScanLabel(`딥 스캔 (${regionLabel})`);
    try {
      const merged = new Map<string, EnrichedVideo>();
      for (const kw of DEEP_SCAN_KEYWORDS) {
        const term = await resolveSearchTerm(kw, regionCode);
        const data = await fetchSearch(term, regionCode);
        for (const v of data.items) {
          if (!merged.has(v.videoId)) merged.set(v.videoId, v);
        }
      }
      setResults([...merged.values()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "딥 스캔 중 오류가 발생했습니다.");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 필터 + 정렬
  const filteredResults = useMemo(() => {
    const minSubsNum = parseInt(minSubs);
    const minViewsNum = parseInt(minViews);
    let list = results.filter(
      (v) => v.subscriberCount >= minSubsNum && v.viewCount >= minViewsNum
    );

    if (videoType !== "all") {
      list = list.filter((v) =>
        videoType === "shorts" ? v.isShorts : !v.isShorts
      );
    }

    if (minMultiplier !== "all") {
      const min = parseFloat(minMultiplier);
      list = list.filter(
        (v) => getOutlierMultiplier(v.viewCount, v.subscriberCount) >= min
      );
    }

    const threshold = getDateThreshold(dateFilter);
    if (threshold) {
      list = list.filter((v) => new Date(v.publishedAt) >= threshold);
    }

    return [...list].sort((a, b) => {
      if (sortMode === "views") return b.viewCount - a.viewCount;
      return (
        getOutlierMultiplier(b.viewCount, b.subscriberCount) -
        getOutlierMultiplier(a.viewCount, a.subscriberCount)
      );
    });
  }, [results, minSubs, minViews, videoType, minMultiplier, dateFilter, sortMode]);

  // 패턴 분석 (필터된 결과 기준)
  const patterns = useMemo(
    () => analyzeOutlierPatterns(filteredResults),
    [filteredResults]
  );

  const anchorSubs = anchorOn ? myChannelSubscribers : undefined;

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-6">
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <div>
          <h1 className="text-lg font-bold">콘텐츠 영감 발굴</h1>
          <p className="text-xs text-muted-foreground">
            떡상 영상을 찾고, 공통 패턴·댓글까지 분석해 다음 콘텐츠를 기획하세요.
          </p>
        </div>
      </div>

      {/* 검색 바 + 국가 */}
      <div className="flex gap-2">
        <Input
          placeholder="키워드를 입력하세요 (예: 푸시업 챌린지, 길거리 인터뷰)"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runSearch(keyword)}
          className="h-10 bg-secondary/50 border-border/50"
        />
        <Select value={regionCode} onValueChange={(v) => v && setRegionCode(v)}>
          <SelectTrigger className="h-10 w-24 shrink-0">
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
        <Button onClick={() => runSearch(keyword)} disabled={isLoading || !keyword.trim()}>
          {isLoading ? "분석 중..." : "발굴"}
        </Button>
      </div>

      {/* 니치 프리셋 칩 */}
      <div className="space-y-2">
        {NICHE_PRESETS.map((group) => (
          <div key={group.label} className="flex flex-wrap items-center gap-2">
            <span className="w-24 shrink-0 text-xs font-semibold text-muted-foreground">
              {group.label}
            </span>
            {group.keywords.map((kw) => (
              <Badge
                key={kw}
                variant="secondary"
                className="cursor-pointer transition-colors hover:bg-primary/20 hover:text-primary"
                onClick={() => runSearch(kw)}
              >
                {kw}
              </Badge>
            ))}
          </div>
        ))}
        <div className="pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={runDeepScan}
            disabled={isLoading}
            className="text-xs"
          >
            🔍 프리셋 딥 스캔 ({DEEP_SCAN_KEYWORDS.length}개 키워드 · 약 {DEEP_SCAN_KEYWORDS.length * 100}유닛)
          </Button>
        </div>
      </div>

      {/* 저장한 레퍼런스 (스와이프 파일) */}
      {mounted && savedRefs.length > 0 && (
        <div className="rounded-lg border border-border/60 bg-secondary/30 p-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRefs((s) => !s)}
              className="flex items-center gap-1.5 text-sm font-semibold hover:text-primary"
            >
              {showRefs ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <Bookmark className="h-4 w-4 text-primary" />
              저장한 레퍼런스 {savedRefs.length}
            </button>
            <button
              onClick={clearRefs}
              className="ml-auto text-xs text-muted-foreground hover:text-destructive"
            >
              전체 비우기
            </button>
          </div>
          {showRefs && (
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {savedRefs.map((video, i) => (
                <OutlierCard
                  key={video.videoId}
                  video={video}
                  rank={i + 1}
                  anchorSubs={anchorSubs}
                  onShowComments={openComments}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* 필터 */}
      {results.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {/* 최소 배수 */}
          <div className="flex items-center gap-1">
            <div className="flex rounded-md border border-border/50">
              {multiplierFilters.map((f) => (
                <Button
                  key={f.value}
                  variant="ghost"
                  size="sm"
                  onClick={() => setMinMultiplier(f.value)}
                  className={cn(
                    "rounded-none border-r border-border/50 last:border-r-0 px-2 h-8 text-xs",
                    minMultiplier === f.value
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {f.label}
                </Button>
              ))}
            </div>
            <MetricInfo metric="outlierMultiplier" />
          </div>

          {/* 영상 타입 */}
          <div className="flex rounded-md border border-border/50">
            {typeFilters.map((f) => (
              <Button
                key={f.value}
                variant="ghost"
                size="sm"
                onClick={() => setVideoType(f.value)}
                className={cn(
                  "rounded-none border-r border-border/50 last:border-r-0 px-2 h-8 text-xs",
                  videoType === f.value
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground"
                )}
              >
                {f.label}
              </Button>
            ))}
          </div>

          {/* 기간 */}
          <div className="flex rounded-md border border-border/50">
            {dateFilters.map((f) => (
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

          {/* 최소 조회수 */}
          <Select value={minViews} onValueChange={(v) => v && setMinViews(v)}>
            <SelectTrigger className="h-8 w-28 text-xs">
              <SelectValue>
                {(v) =>
                  `조회수 ${viewFilters.find((f) => f.value === v)?.label ?? ""}`
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {viewFilters.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  조회수 {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 최소 구독자 */}
          <Select value={minSubs} onValueChange={(v) => v && setMinSubs(v)}>
            <SelectTrigger className="h-8 w-28 text-xs">
              <SelectValue>
                {(v) =>
                  `구독 ${subFilters.find((f) => f.value === v)?.label ?? ""}`
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {subFilters.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  구독 {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="ml-auto text-sm text-muted-foreground">
            {scanLabel} · {filteredResults.length}개
          </span>
        </div>
      )}

      {/* 렌즈: 정렬 / 뷰 모드 / 내 채널 기준 */}
      {results.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            정렬
            <div className="flex rounded-md border border-border/50">
              {sortModes.map((s) => (
                <Button
                  key={s.value}
                  variant="ghost"
                  size="sm"
                  onClick={() => setSortMode(s.value)}
                  className={cn(
                    "rounded-none border-r border-border/50 last:border-r-0 px-2 h-8 text-xs",
                    sortMode === s.value ? "bg-primary/15 text-primary" : "text-muted-foreground"
                  )}
                >
                  {s.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            뷰
            <div className="flex rounded-md border border-border/50">
              {viewModes.map((m) => (
                <Button
                  key={m.value}
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode(m.value)}
                  className={cn(
                    "rounded-none border-r border-border/50 last:border-r-0 px-2 h-8 text-xs",
                    viewMode === m.value ? "bg-primary/15 text-primary" : "text-muted-foreground"
                  )}
                >
                  {m.label}
                </Button>
              ))}
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={anchorOn}
              onChange={(e) => setAnchorOn(e.target.checked)}
              className="accent-primary"
            />
            내 채널 기준
          </label>
          {anchorOn && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              구독
              <Input
                type="number"
                value={myChannelSubscribers}
                onChange={(e) => setMyChannelSubscribers(Number(e.target.value))}
                className="h-8 w-24"
              />
            </span>
          )}
        </div>
      )}

      {/* 패턴 인사이트 */}
      {!isLoading && filteredResults.length > 0 && (
        <PatternInsights patterns={patterns} onKeywordClick={runSearch} />
      )}

      {/* 로딩 */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-video w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* 결과: 카드 모드 */}
      {!isLoading && filteredResults.length > 0 && viewMode === "card" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredResults.map((video, i) => (
            <OutlierCard
              key={video.videoId}
              video={video}
              rank={i + 1}
              anchorSubs={anchorSubs}
              onShowComments={openComments}
            />
          ))}
        </div>
      )}

      {/* 결과: 썸네일 갤러리 모드 */}
      {!isLoading && filteredResults.length > 0 && viewMode === "thumb" && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filteredResults.map((video, i) => {
            const m = getOutlierMultiplier(video.viewCount, video.subscriberCount);
            const tier = getOutlierTier(m);
            return (
              <button
                key={video.videoId}
                type="button"
                onClick={() => setLightboxVideo(video)}
                className="group relative aspect-video w-full overflow-hidden rounded-lg border border-border/50 text-left"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
                {video.subscriberCount > 0 && (
                  <span
                    className={cn(
                      "absolute left-1.5 top-1.5 rounded border px-1.5 py-0.5 text-[11px] font-bold backdrop-blur-sm",
                      tier.colorClass
                    )}
                  >
                    {formatMultiplier(m)}
                  </span>
                )}
                <span className="absolute right-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  #{i + 1}
                </span>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-2">
                  <p className="line-clamp-2 text-xs font-medium text-white">
                    {video.title}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* 결과 없음 */}
      {!isLoading && searched && filteredResults.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-lg">조건에 맞는 영상이 없어요</p>
          <p className="mt-1 text-sm">필터를 완화하거나 다른 키워드로 발굴해보세요.</p>
        </div>
      )}

      {/* 초기 상태 */}
      {!isLoading && !searched && (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
          <Sparkles className="mb-3 h-10 w-10 text-primary/40" />
          <p className="text-lg">키워드나 프리셋으로 떡상 영상을 발굴하세요</p>
          <p className="mt-1 text-sm">
            구독자 대비 조회수 배수가 높은 영상이 상단에 정렬됩니다.
          </p>
        </div>
      )}

      {/* 댓글 시트 / 썸네일 라이트박스 */}
      <CommentsSheet
        video={commentsVideo}
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
      />
      <ThumbnailLightbox
        video={lightboxVideo}
        onClose={() => setLightboxVideo(null)}
        onShowComments={(v) => {
          setLightboxVideo(null);
          openComments(v);
        }}
      />
    </div>
  );
}
