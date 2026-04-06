/**
 * 영상 찾기 페이지
 * 키워드 검색 → 유튜브 영상 수집 → 반응도 분석 결과를 테이블/카드로 표시
 * 필터(쇼츠/일반, 업로드 날짜), 더 불러오기 기능 포함
 */

"use client";

import { useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/search/search-bar";
import SearchFilters from "@/components/search/search-filters";
import VideoTable from "@/components/search/video-table";
import { useSearchStore } from "@/stores/search-store";

/** 내부 검색 컴포넌트 (Suspense 경계 내부에서 useSearchParams 사용) */
function SearchContent() {
  const searchParams = useSearchParams();
  const queryKeyword = searchParams.get("q") ?? "";

  const {
    keyword,
    regionCode,
    videoTypeFilter,
    dateFilter,
    sortBy,
    results,
    nextPageToken,
    isLoading,
    error,
    totalResults,
    selectedVideoIds,
    setRegionCode,
    setVideoTypeFilter,
    setDateFilter,
    setSortBy,
    search,
    loadMore,
    toggleVideoSelection,
    toggleSelectAll,
    getFilteredResults,
  } = useSearchStore();

  // URL 쿼리 파라미터에서 키워드를 읽어 자동 검색 실행
  const searchWithKeyword = useCallback(
    (kw: string) => {
      search(kw);
    },
    [search]
  );

  useEffect(() => {
    if (queryKeyword && queryKeyword !== keyword) {
      searchWithKeyword(queryKeyword);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKeyword]);

  /** 검색 바에서 검색 실행 */
  const handleSearch = (newKeyword: string) => {
    window.history.pushState(
      null,
      "",
      `/search?q=${encodeURIComponent(newKeyword)}`
    );
    search(newKeyword);
  };

  // 필터가 적용된 결과 목록
  const filteredResults = getFilteredResults();

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-6">
      {/* 검색 바 */}
      <SearchBar initialKeyword={queryKeyword} onSearch={handleSearch} />

      {/* 필터 + 결과 수 */}
      {results.length > 0 && (
        <SearchFilters
          videoTypeFilter={videoTypeFilter}
          onVideoTypeChange={setVideoTypeFilter}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          regionCode={regionCode}
          onRegionChange={(code) => {
            setRegionCode(code);
            if (keyword) search(keyword);
          }}
          totalResults={totalResults}
          displayCount={filteredResults.length}
        />
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* 영상 결과 테이블/카드 */}
      <VideoTable
        videos={filteredResults}
        isLoading={isLoading}
        selectedVideoIds={selectedVideoIds}
        onToggleSelect={toggleVideoSelection}
        onToggleSelectAll={toggleSelectAll}
      />

      {/* 하단: 더 불러오기 */}
      {results.length > 0 && nextPageToken && (
        <div className="flex justify-end border-t border-border/50 pt-4">
          <Button
            onClick={loadMore}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? "불러오는 중..." : "더 불러오기"}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
