/**
 * 키워드 분석 페이지
 * 연관 키워드 추천 (YouTube Suggest API) + 경쟁도 점수 + 반응도 분포 차트
 */

"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import ReactionPieChart from "@/components/charts/reaction-pie-chart";
import { calculateCompetitionScore, calculateReactionDistribution } from "@/lib/keyword-analysis";
import type { EnrichedVideo, SearchApiResponse, ReactionDistribution, CompetitionResult } from "@/types/analysis";

export default function KeywordsPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [competition, setCompetition] = useState<CompetitionResult | null>(null);
  const [distribution, setDistribution] = useState<ReactionDistribution | null>(null);
  const [videos, setVideos] = useState<EnrichedVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** 키워드 분석 실행 */
  const handleAnalyze = async () => {
    const trimmed = keyword.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError(null);

    try {
      // Suggest API + 검색 API 병렬 호출
      const [suggestRes, searchRes] = await Promise.all([
        fetch(`/api/youtube/suggest?q=${encodeURIComponent(trimmed)}`),
        fetch("/api/youtube/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyword: trimmed, maxResults: 25 }),
        }),
      ]);

      // 연관 키워드
      if (suggestRes.ok) {
        const suggestData = await suggestRes.json();
        setSuggestions(suggestData.suggestions ?? []);
      }

      // 검색 결과 분석
      if (searchRes.ok) {
        const searchData: SearchApiResponse = await searchRes.json();
        setVideos(searchData.items);
        setCompetition(calculateCompetitionScore(searchData.totalResults));
        setDistribution(calculateReactionDistribution(searchData.items));
      } else {
        const errData = await searchRes.json();
        throw new Error(errData.error ?? "검색 실패");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  /** 연관 키워드 클릭 → 해당 키워드로 재분석 */
  const handleSuggestionClick = (suggestion: string) => {
    setKeyword(suggestion);
    // 자동 분석은 하지 않고 입력만 채움
  };

  /** 영상 찾기로 이동 */
  const goToSearch = (kw: string) => {
    router.push(`/search?q=${encodeURIComponent(kw)}`);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      {/* 검색 바 */}
      <div className="flex gap-2">
        <Input
          placeholder="분석할 키워드를 입력하세요"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
          className="h-10 bg-secondary/50 border-border/50"
        />
        <Button onClick={handleAnalyze} disabled={isLoading || !keyword.trim()}>
          {isLoading ? "분석 중..." : "키워드 분석"}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* 로딩 */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      )}

      {/* 분석 결과 */}
      {!isLoading && (competition || suggestions.length > 0) && (
        <>
        {/* 자동완성 TOP 5 */}
        {suggestions.length > 0 && (
          <Card>
            <CardContent className="p-5">
              <h3 className="mb-3 font-semibold">자동완성 키워드 TOP 5</h3>
              <div className="space-y-1">
                {suggestions.slice(0, 5).map((s, i) => (
                  <button
                    key={s}
                    onClick={() => handleSuggestionClick(s)}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-secondary/50"
                  >
                    <span className="w-6 text-center font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="font-medium">{s}</span>
                    <span
                      className="ml-auto cursor-pointer text-xs text-primary hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        goToSearch(s);
                      }}
                    >
                      영상 찾기 →
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* 연관 키워드 전체 */}
          <Card>
            <CardContent className="p-5">
              <h3 className="mb-3 font-semibold">연관 키워드</h3>
              {suggestions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  연관 키워드가 없습니다.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <Badge
                      key={s}
                      variant="secondary"
                      className="cursor-pointer transition-colors hover:bg-primary/20 hover:text-primary"
                      onClick={() => handleSuggestionClick(s)}
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              )}
              {keyword.trim() && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => goToSearch(keyword)}
                >
                  &quot;{keyword}&quot; 영상 찾기 →
                </Button>
              )}
            </CardContent>
          </Card>

          {/* 경쟁도 점수 */}
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-5">
              <h3 className="mb-3 font-semibold">키워드 경쟁도</h3>
              {competition && (
                <>
                  {/* 원형 게이지 */}
                  <div className="relative flex h-32 w-32 items-center justify-center">
                    <svg
                      className="h-full w-full -rotate-90"
                      viewBox="0 0 100 100"
                    >
                      {/* 배경 원 */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="hsl(220 10% 20%)"
                        strokeWidth="8"
                      />
                      {/* 진행 원 */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={
                          competition.score < 33
                            ? "#34d399"
                            : competition.score < 66
                              ? "#fbbf24"
                              : "#f87171"
                        }
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${competition.score * 2.51} 251`}
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-2xl font-bold">
                        {competition.score}
                      </span>
                      <p className="text-[10px] text-muted-foreground">
                        / 100
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      competition.level === "낮음"
                        ? "mt-2 bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : competition.level === "보통"
                          ? "mt-2 bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                          : "mt-2 bg-red-500/20 text-red-400 border-red-500/30"
                    }
                  >
                    경쟁도: {competition.level}
                  </Badge>
                  <p className="mt-2 text-xs text-muted-foreground">
                    경쟁도가 낮을수록 상위 노출 가능성이 높습니다
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* 반응도 분포 */}
          <Card>
            <CardContent className="p-5">
              <h3 className="mb-3 font-semibold">반응도 분포</h3>
              {distribution && (
                <>
                  <ReactionPieChart distribution={distribution} height={180} />
                  <div className="mt-2 flex justify-center gap-4 text-xs text-muted-foreground">
                    <span>Good: {distribution.good}개</span>
                    <span>Normal: {distribution.normal}개</span>
                    <span>Bad: {distribution.bad}개</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        </>
      )}

      {/* 분석 영상 Top 5 */}
      {!isLoading && videos.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h3 className="mb-3 font-semibold">
              반응도 높은 영상 Top 5
            </h3>
            <div className="space-y-2">
              {[...videos]
                .sort((a, b) => b.reaction.ratio - a.reaction.ratio)
                .slice(0, 5)
                .map((v, i) => (
                  <a
                    key={v.videoId}
                    href={`https://youtube.com/watch?v=${v.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-secondary/50"
                  >
                    <span className="w-6 text-center text-sm font-bold text-primary">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {v.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {v.channelTitle} · 조회 {(v.viewCount).toLocaleString()}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    >
                      {(v.reaction.ratio * 100).toFixed(1)}%
                    </Badge>
                  </a>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
