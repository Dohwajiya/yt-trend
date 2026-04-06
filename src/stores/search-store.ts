/**
 * 검색 상태 관리 스토어
 * 키워드 검색, 필터, 결과 목록, 페이지네이션을 관리하는 Zustand 스토어
 */

import { create } from "zustand";
import type {
  EnrichedVideo,
  VideoTypeFilter,
  SearchApiResponse,
} from "@/types/analysis";
import type { DateFilter } from "@/components/search/search-filters";
import { useHistoryStore } from "@/stores/history-store";

/**
 * 날짜 필터에 해당하는 기준 날짜를 반환하는 함수
 * "all"이면 null 반환 (필터 없음)
 */
function getDateThreshold(filter: DateFilter): Date | null {
  if (filter === "all") return null;
  const now = new Date();
  switch (filter) {
    case "1d":
      now.setDate(now.getDate() - 1);
      break;
    case "1w":
      now.setDate(now.getDate() - 7);
      break;
    case "1m":
      now.setMonth(now.getMonth() - 1);
      break;
    case "3m":
      now.setMonth(now.getMonth() - 3);
      break;
    case "1y":
      now.setFullYear(now.getFullYear() - 1);
      break;
  }
  return now;
}

/** 검색 스토어 상태 + 액션 타입 */
interface SearchState {
  keyword: string;
  regionCode: string;
  videoTypeFilter: VideoTypeFilter;
  dateFilter: DateFilter;
  results: EnrichedVideo[];
  nextPageToken: string | null;
  isLoading: boolean;
  error: string | null;
  totalResults: number;
  selectedVideoIds: Set<string>;

  setKeyword: (keyword: string) => void;
  setRegionCode: (code: string) => void;
  setVideoTypeFilter: (filter: VideoTypeFilter) => void;
  setDateFilter: (filter: DateFilter) => void;
  search: (keyword?: string) => Promise<void>;
  loadMore: () => Promise<void>;
  reset: () => void;
  toggleVideoSelection: (videoId: string) => void;
  toggleSelectAll: () => void;
  clearSelection: () => void;
  getFilteredResults: () => EnrichedVideo[];
  getSelectedVideos: () => EnrichedVideo[];
}

async function fetchSearchResults(
  keyword: string,
  regionCode: string,
  pageToken?: string
): Promise<SearchApiResponse> {
  const response = await fetch("/api/youtube/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyword, regionCode, pageToken, maxResults: 25 }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error ?? "검색에 실패했습니다.");
  }

  return response.json();
}

export const useSearchStore = create<SearchState>((set, get) => ({
  keyword: "",
  regionCode: "KR",
  videoTypeFilter: "all",
  dateFilter: "all",
  results: [],
  nextPageToken: null,
  isLoading: false,
  error: null,
  totalResults: 0,
  selectedVideoIds: new Set(),

  setKeyword: (keyword) => set({ keyword }),
  setRegionCode: (regionCode) => set({ regionCode }),
  setVideoTypeFilter: (videoTypeFilter) => set({ videoTypeFilter }),
  setDateFilter: (dateFilter) => set({ dateFilter }),

  search: async (keyword?: string) => {
    const state = get();
    const searchKeyword = keyword ?? state.keyword;
    if (!searchKeyword.trim()) return;

    set({
      keyword: searchKeyword,
      isLoading: true,
      error: null,
      results: [],
      nextPageToken: null,
      totalResults: 0,
      selectedVideoIds: new Set(),
    });

    try {
      const data = await fetchSearchResults(searchKeyword, state.regionCode);
      set({
        results: data.items,
        nextPageToken: data.nextPageToken,
        totalResults: data.totalResults,
        isLoading: false,
      });
      useHistoryStore.getState().addSearch(searchKeyword, data.totalResults);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "검색 중 오류가 발생했습니다.",
        isLoading: false,
      });
    }
  },

  loadMore: async () => {
    const state = get();
    if (!state.nextPageToken || state.isLoading) return;

    set({ isLoading: true, error: null });

    try {
      const data = await fetchSearchResults(
        state.keyword,
        state.regionCode,
        state.nextPageToken
      );
      set({
        results: [...state.results, ...data.items],
        nextPageToken: data.nextPageToken,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "추가 로딩 중 오류가 발생했습니다.",
        isLoading: false,
      });
    }
  },

  reset: () =>
    set({
      keyword: "",
      results: [],
      nextPageToken: null,
      isLoading: false,
      error: null,
      totalResults: 0,
      selectedVideoIds: new Set(),
      dateFilter: "all",
    }),

  toggleVideoSelection: (videoId) => {
    const state = get();
    const newSet = new Set(state.selectedVideoIds);
    if (newSet.has(videoId)) {
      newSet.delete(videoId);
    } else {
      newSet.add(videoId);
    }
    set({ selectedVideoIds: newSet });
  },

  toggleSelectAll: () => {
    const state = get();
    const filtered = state.getFilteredResults();
    const allSelected = filtered.every((v) => state.selectedVideoIds.has(v.videoId));
    if (allSelected) {
      set({ selectedVideoIds: new Set() });
    } else {
      set({ selectedVideoIds: new Set(filtered.map((v) => v.videoId)) });
    }
  },

  clearSelection: () => set({ selectedVideoIds: new Set() }),

  getFilteredResults: () => {
    const state = get();
    let filtered = state.results;

    // 영상 타입 필터
    if (state.videoTypeFilter !== "all") {
      filtered = filtered.filter((v) =>
        state.videoTypeFilter === "shorts" ? v.isShorts : !v.isShorts
      );
    }

    // 업로드 날짜 필터
    const threshold = getDateThreshold(state.dateFilter);
    if (threshold) {
      filtered = filtered.filter(
        (v) => new Date(v.publishedAt) >= threshold
      );
    }

    return filtered;
  },

  getSelectedVideos: () => {
    const state = get();
    return state.results.filter((v) => state.selectedVideoIds.has(v.videoId));
  },
}));
