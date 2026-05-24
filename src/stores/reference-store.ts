/**
 * 레퍼런스(스와이프 파일) 스토어
 * 영감 발굴에서 찾은 참고 영상을 localStorage에 저장한다 (PD용 자료 모음).
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { EnrichedVideo } from "@/types/analysis";

interface ReferenceState {
  /** 저장한 레퍼런스 영상 목록 (최신순) */
  videos: EnrichedVideo[];
  /** 레퍼런스 추가 (중복 시 무시) */
  addReference: (video: EnrichedVideo) => void;
  /** 레퍼런스 제거 */
  removeReference: (videoId: string) => void;
  /** 저장 여부 확인 */
  hasReference: (videoId: string) => boolean;
  /** 전체 비우기 */
  clearAll: () => void;
}

/** 최대 저장 개수 */
const MAX_REFERENCES = 100;

export const useReferenceStore = create<ReferenceState>()(
  persist(
    (set, get) => ({
      videos: [],

      addReference: (video) => {
        const state = get();
        if (state.videos.some((v) => v.videoId === video.videoId)) return;
        set({ videos: [video, ...state.videos].slice(0, MAX_REFERENCES) });
      },

      removeReference: (videoId) =>
        set({ videos: get().videos.filter((v) => v.videoId !== videoId) }),

      hasReference: (videoId) =>
        get().videos.some((v) => v.videoId === videoId),

      clearAll: () => set({ videos: [] }),
    }),
    { name: "yt-trend-references" }
  )
);
