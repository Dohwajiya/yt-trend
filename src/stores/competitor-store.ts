/**
 * 경쟁 채널 워치리스트 스토어
 * 추적할 경쟁 채널을 localStorage에 저장한다 (DB 없이 실시간 벤치마킹용)
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

/** 워치리스트에 저장되는 채널 식별 정보 */
export interface WatchedChannel {
  /** 채널 ID */
  channelId: string;
  /** 채널명 */
  channelTitle: string;
  /** 채널 프로필 이미지 URL */
  channelThumbnailUrl: string;
}

interface CompetitorState {
  /** 추적 중인 경쟁 채널 목록 */
  channels: WatchedChannel[];
  /** 채널 추가 (중복 시 무시) */
  addChannel: (channel: WatchedChannel) => void;
  /** 채널 제거 */
  removeChannel: (channelId: string) => void;
  /** 이미 추적 중인지 여부 */
  hasChannel: (channelId: string) => boolean;
  /** 전체 비우기 */
  clearAll: () => void;
}

/** 최대 추적 채널 수 (channels.list 배치 한도와 동일) */
const MAX_CHANNELS = 30;

export const useCompetitorStore = create<CompetitorState>()(
  persist(
    (set, get) => ({
      channels: [],

      addChannel: (channel) => {
        const state = get();
        // 이미 있으면 추가하지 않음
        if (state.channels.some((c) => c.channelId === channel.channelId)) {
          return;
        }
        set({
          channels: [...state.channels, channel].slice(0, MAX_CHANNELS),
        });
      },

      removeChannel: (channelId) =>
        set({
          channels: get().channels.filter((c) => c.channelId !== channelId),
        }),

      hasChannel: (channelId) =>
        get().channels.some((c) => c.channelId === channelId),

      clearAll: () => set({ channels: [] }),
    }),
    { name: "yt-trend-competitors" }
  )
);
