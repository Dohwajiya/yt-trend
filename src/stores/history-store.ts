/**
 * 검색 히스토리 스토어
 * 최근 검색 키워드를 localStorage에 저장하여 대시보드에서 표시
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SearchHistoryItem } from "@/types/analysis";

interface HistoryState {
  /** 검색 히스토리 (최신순) */
  searches: SearchHistoryItem[];
  /** 검색 기록 추가 */
  addSearch: (keyword: string, resultCount: number) => void;
  /** 전체 히스토리 삭제 */
  clearHistory: () => void;
}

/** 최대 보관 개수 */
const MAX_HISTORY = 20;

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      searches: [],

      addSearch: (keyword, resultCount) => {
        const state = get();
        // 같은 키워드가 이미 있으면 제거 후 맨 앞에 추가
        const filtered = state.searches.filter(
          (s) => s.keyword !== keyword
        );
        const newItem: SearchHistoryItem = {
          keyword,
          timestamp: new Date().toISOString(),
          resultCount,
        };
        set({
          searches: [newItem, ...filtered].slice(0, MAX_HISTORY),
        });
      },

      clearHistory: () => set({ searches: [] }),
    }),
    { name: "yt-trend-history" }
  )
);
