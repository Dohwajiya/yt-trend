/**
 * 키워드·트렌드 발굴 페이지
 * 최대 5개 키워드를 비교 분석하여 경쟁도·평균 반응도·기회 점수를 표와
 * 기회 매트릭스(산점도)로 보여주고, 주력 키워드의 연관어 확장·반응도 분포를 제공한다.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, TrendingUp, Plus } from "lucide-react";
import MetricInfo from "@/components/ui/metric-info";
import ReactionPieChart from "@/components/charts/reaction-pie-chart";
import KeywordOpportunityChart from "@/components/charts/keyword-opportunity-chart";
import { NICHE_PRESETS } from "@/lib/niche-presets";
import { REGIONS } from "@/lib/regions";
import {
  calculateCompetitionScore,
  calculateReactionDistribution,
  calculateAverageReactionRatio,
  calculateOpportunityScore,
} from "@/lib/keyword-analysis";
import { formatRatio } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  EnrichedVideo,
  SearchApiResponse,
  ReactionDistribution,
  KeywordComparison,
} from "@/types/analysis";

/** 최대 비교 키워드 수 */
const MAX_KEYWORDS = 5;

/** 영상 검색 API 호출 */
async function fetchSearch(
  keyword: string,
  regionCode: string
): Promise<SearchApiResponse> {
  const res = await fetch("/api/youtube/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyword, regionCode, maxResults: 25 }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "검색에 실패했습니다.");
  }
  return res.json();
}

/** 연관 키워드(자동완성) 조회 — 0유닛 */
async function fetchSuggest(keyword: string): Promise<string[]> {
  const res = await fetch(`/api/youtube/suggest?q=${encodeURIComponent(keyword)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.suggestions ?? [];
}

/** 경쟁도 등급 배지 색상 */
function competitionBadgeClass(level: "낮음" | "보통" | "높음"): string {
  if (level === "낮음") return "bg-emerald-500/15 text-emerald-700 border-emerald-500/30";
  if (level === "보통") return "bg-yellow-500/15 text-yellow-700 border-yellow-500/30";
  return "bg-red-500/15 text-red-700 border-red-500/30";
}

/** 기회 점수 배지 색상 */
function opportunityBadgeClass(score: number): string {
  if (score >= 70) return "bg-emerald-500/15 text-emerald-700 border-emerald-500/30";
  if (score >= 40) return "bg-yellow-500/15 text-yellow-700 border-yellow-500/30";
  return "bg-gray-500/15 text-gray-600 border-gray-400/30";
}

export default function KeywordsPage() {
  const router = useRouter();

  const [keywords, setKeywords] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [regionCode, setRegionCode] = useState("KR");
  const [comparisons, setComparisons] = useState<KeywordComparison[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [distribution, setDistribution] = useState<ReactionDistribution | null>(null);
  const [topVideos, setTopVideos] = useState<EnrichedVideo[]>([]);
  const [primaryKeyword, setPrimaryKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzed, setAnalyzed] = useState(false);

  /** 키워드 칩 추가 (중복·한도 체크) */
  const addKeyword = (kw: string) => {
    const t = kw.trim();
    if (!t) return;
    setKeywords((prev) =>
      prev.includes(t) || prev.length >= MAX_KEYWORDS ? prev : [...prev, t]
    );
    setInput("");
  };

  /** 키워드 칩 제거 */
  const removeKeyword = (kw: string) => {
    setKeywords((prev) => prev.filter((k) => k !== kw));
  };

  /** 비교 분석 실행 */
  const handleAnalyze = async () => {
    // 칩 + 입력창에 남은 값 합산
    const list = [...keywords];
    const pending = input.trim();
    if (pending && !list.includes(pending) && list.length < MAX_KEYWORDS) {
      list.push(pending);
    }
    if (list.length === 0) return;

    setKeywords(list);
    setInput("");
    setIsLoading(true);
    setError(null);
    setAnalyzed(true);

    try {
      // 키워드별 검색 병렬 실행
      const searchResults = await Promise.all(
        list.map((kw) =>
          fetchSearch(kw, regionCode).then((data) => ({ kw, data }))
        )
      );

      // 비교 데이터 구성
      const comps: KeywordComparison[] = searchResults.map(({ kw, data }) => {
        const comp = calculateCompetitionScore(data.totalResults);
        const avg = calculateAverageReactionRatio(data.items);
        const opp = calculateOpportunityScore(comp.score, avg);
        return {
          keyword: kw,
          totalResults: data.totalResults,
          competitionScore: comp.score,
          competitionLevel: comp.level,
          avgReactionRatio: avg,
          opportunityScore: opp.score,
        };
      });
      setComparisons(comps);

      // 주력 키워드(첫 번째) 상세
      const primary = searchResults[0];
      setPrimaryKeyword(primary.kw);
      setDistribution(calculateReactionDistribution(primary.data.items));
      setTopVideos(
        [...primary.data.items]
          .sort((a, b) => b.reaction.ratio - a.reaction.ratio)
          .slice(0, 5)
      );

      // 연관어 1·2단계 확장 (무료)
      const base = await fetchSuggest(primary.kw);
      const seeds = base.slice(0, 5);
      const expansions = await Promise.all(seeds.map((s) => fetchSuggest(s)));
      const all = new Set<string>(base);
      expansions.forEach((arr) => arr.forEach((s) => all.add(s)));
      list.forEach((k) => all.delete(k));
      setSuggestions([...all]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const goToSearch = (kw: string) => {
    router.push(`/search?q=${encodeURIComponent(kw)}`);
  };

  const canAnalyze = !isLoading && (keywords.length > 0 || input.trim().length > 0);

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-6">
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        <div>
          <h1 className="text-lg font-bold">키워드·트렌드 발굴</h1>
          <p className="text-xs text-muted-foreground">
            최대 {MAX_KEYWORDS}개 키워드를 비교해 저경쟁·고반응 기회 키워드를 찾으세요.
          </p>
        </div>
      </div>

      {/* 키워드 입력 */}
      <div className="flex gap-2">
        <Input
          placeholder="키워드 입력 후 추가 (예: 푸시업 챌린지)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addKeyword(input);
          }}
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
        <Button
          variant="outline"
          onClick={() => addKeyword(input)}
          disabled={!input.trim() || keywords.length >= MAX_KEYWORDS}
        >
          <Plus className="mr-1 h-4 w-4" /> 추가
        </Button>
        <Button onClick={handleAnalyze} disabled={!canAnalyze}>
          {isLoading ? "분석 중..." : "비교 분석"}
        </Button>
      </div>

      {/* 선택된 키워드 칩 */}
      {keywords.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {keywords.map((kw) => (
            <Badge
              key={kw}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              {kw}
              <button
                onClick={() => removeKeyword(kw)}
                className="rounded-full p-0.5 hover:bg-background/50"
                aria-label={`${kw} 제거`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <span className="text-xs text-muted-foreground">
            {keywords.length}/{MAX_KEYWORDS} · 키워드당 약 100유닛
          </span>
        </div>
      )}

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
                onClick={() => addKeyword(kw)}
              >
                {kw}
              </Badge>
            ))}
          </div>
        ))}
      </div>

      {/* 에러 */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* 로딩 */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      )}

      {/* 비교 결과 */}
      {!isLoading && comparisons.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* 비교 표 */}
            <Card>
              <CardContent className="p-5">
                <h3 className="mb-3 font-semibold">키워드 비교</h3>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>키워드</TableHead>
                      <TableHead className="text-right">결과 수</TableHead>
                      <TableHead className="text-center">
                        <span className="inline-flex items-center gap-1">
                          경쟁도 <MetricInfo metric="competition" />
                        </span>
                      </TableHead>
                      <TableHead className="text-right">
                        <span className="inline-flex items-center gap-1">
                          평균 반응도 <MetricInfo metric="avgReaction" />
                        </span>
                      </TableHead>
                      <TableHead className="text-center">
                        <span className="inline-flex items-center gap-1">
                          기회 <MetricInfo metric="opportunity" />
                        </span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...comparisons]
                      .sort((a, b) => b.opportunityScore - a.opportunityScore)
                      .map((c) => (
                        <TableRow
                          key={c.keyword}
                          className="cursor-pointer hover:bg-secondary/30"
                          onClick={() => goToSearch(c.keyword)}
                        >
                          <TableCell className="font-medium">{c.keyword}</TableCell>
                          <TableCell className="text-right text-sm">
                            {c.totalResults.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={cn("text-[10px]", competitionBadgeClass(c.competitionLevel))}
                            >
                              {c.competitionLevel}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {formatRatio(c.avgReactionRatio)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={cn("text-[10px]", opportunityBadgeClass(c.opportunityScore))}
                            >
                              {c.opportunityScore}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* 기회 매트릭스 */}
            <Card>
              <CardContent className="p-5">
                <h3 className="mb-1 font-semibold">기회 매트릭스</h3>
                <p className="mb-2 text-[11px] text-muted-foreground">
                  좌상단(저경쟁·고반응)일수록 노릴 만한 키워드입니다.
                </p>
                <KeywordOpportunityChart data={comparisons} height={260} />
              </CardContent>
            </Card>
          </div>

          {/* 주력 키워드 상세 */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* 연관어 확장 */}
            <Card>
              <CardContent className="p-5">
                <h3 className="mb-3 font-semibold">
                  연관 키워드 {primaryKeyword && `· "${primaryKeyword}"`}
                </h3>
                {suggestions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">연관 키워드가 없습니다.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((s) => (
                      <Badge
                        key={s}
                        variant="secondary"
                        className="cursor-pointer transition-colors hover:bg-primary/20 hover:text-primary"
                        onClick={() => addKeyword(s)}
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 반응도 분포 */}
            <Card>
              <CardContent className="p-5">
                <h3 className="mb-3 font-semibold">
                  반응도 분포 {primaryKeyword && `· "${primaryKeyword}"`}
                </h3>
                {distribution && (
                  <>
                    <ReactionPieChart distribution={distribution} height={200} />
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

          {/* 반응도 Top 5 */}
          {topVideos.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h3 className="mb-3 font-semibold">
                  반응도 높은 영상 Top 5 {primaryKeyword && `· "${primaryKeyword}"`}
                </h3>
                <div className="space-y-2">
                  {topVideos.map((v, i) => (
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
                        <p className="truncate text-sm font-medium">{v.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {v.channelTitle} · 조회 {v.viewCount.toLocaleString()}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
                      >
                        {formatRatio(v.reaction.ratio)}
                      </Badge>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* 초기 상태 */}
      {!isLoading && !analyzed && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <TrendingUp className="mb-3 h-10 w-10 text-primary/40" />
          <p className="text-lg">키워드를 추가하고 비교 분석을 실행하세요</p>
          <p className="mt-1 text-sm">여러 키워드의 경쟁도와 반응도를 한눈에 비교합니다.</p>
        </div>
      )}
    </div>
  );
}
