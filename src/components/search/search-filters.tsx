/**
 * 검색 필터 컴포넌트
 * 쇼츠/일반 영상 필터, 업로드 날짜 필터, 지역 선택 기능을 제공
 */

"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { VideoTypeFilter } from "@/types/analysis";
import { cn } from "@/lib/utils";

/** 업로드 날짜 필터 값 */
export type DateFilter = "all" | "1d" | "1w" | "1m" | "3m" | "1y";

/** 정렬 기준 */
export type SortBy = "relevance" | "viewCount" | "date" | "reaction";

interface SearchFiltersProps {
  videoTypeFilter: VideoTypeFilter;
  onVideoTypeChange: (filter: VideoTypeFilter) => void;
  dateFilter: DateFilter;
  onDateFilterChange: (filter: DateFilter) => void;
  sortBy: SortBy;
  onSortByChange: (sort: SortBy) => void;
  regionCode: string;
  onRegionChange: (code: string) => void;
  totalResults: number;
  displayCount: number;
}

/** 영상 타입 필터 옵션 */
const typeFilters: { value: VideoTypeFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "regular", label: "일반 영상" },
  { value: "shorts", label: "쇼츠" },
];

/** 업로드 날짜 필터 옵션 */
const dateFilters: { value: DateFilter; label: string }[] = [
  { value: "all", label: "전체 기간" },
  { value: "1d", label: "1일" },
  { value: "1w", label: "1주일" },
  { value: "1m", label: "1개월" },
  { value: "3m", label: "3개월" },
  { value: "1y", label: "1년" },
];

/** 정렬 옵션 */
const sortOptions: { value: SortBy; label: string }[] = [
  { value: "relevance", label: "관련도순" },
  { value: "viewCount", label: "조회수순" },
  { value: "date", label: "최신순" },
  { value: "reaction", label: "반응도순" },
];

/** 지역 코드 옵션 */
const regions = [
  { value: "KR", label: "한국" },
  { value: "US", label: "미국" },
  { value: "JP", label: "일본" },
  { value: "GB", label: "영국" },
  { value: "IN", label: "인도" },
];

export default function SearchFilters({
  videoTypeFilter,
  onVideoTypeChange,
  dateFilter,
  onDateFilterChange,
  sortBy,
  onSortByChange,
  regionCode,
  onRegionChange,
  totalResults,
  displayCount,
}: SearchFiltersProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* 좌측: 필터 그룹 */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 영상 타입 필터 */}
          <div className="flex rounded-md border border-border/50">
            {typeFilters.map((filter) => (
              <Button
                key={filter.value}
                variant="ghost"
                size="sm"
                onClick={() => onVideoTypeChange(filter.value)}
                className={cn(
                  "rounded-none border-r border-border/50 last:border-r-0 px-3 h-8 text-xs",
                  videoTypeFilter === filter.value
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground"
                )}
              >
                {filter.label}
              </Button>
            ))}
          </div>

          {/* 지역 선택 */}
          <Select value={regionCode} onValueChange={(val) => { if (val) onRegionChange(val); }}>
            <SelectTrigger className="h-8 w-24 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {regions.map((region) => (
                <SelectItem key={region.value} value={region.value}>
                  {region.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 우측: 결과 수 표시 */}
        <span className="text-sm text-muted-foreground">
          결과: {displayCount}건
          {totalResults > 0 && ` / 총 ${totalResults.toLocaleString()}건`}
        </span>
      </div>

      {/* 2행: 날짜 필터 + 정렬 */}
      <div className="flex flex-wrap items-center gap-2">
        {/* 업로드 날짜 필터 */}
        <div className="flex rounded-md border border-border/50">
          {dateFilters.map((filter) => (
            <Button
              key={filter.value}
              variant="ghost"
              size="sm"
              onClick={() => onDateFilterChange(filter.value)}
              className={cn(
                "rounded-none border-r border-border/50 last:border-r-0 px-2 h-8 text-xs",
                dateFilter === filter.value
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground"
              )}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {/* 정렬 */}
        <div className="flex rounded-md border border-border/50">
          {sortOptions.map((opt) => (
            <Button
              key={opt.value}
              variant="ghost"
              size="sm"
              onClick={() => onSortByChange(opt.value)}
              className={cn(
                "rounded-none border-r border-border/50 last:border-r-0 px-2 h-8 text-xs",
                sortBy === opt.value
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground"
              )}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
