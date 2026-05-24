/**
 * 앱 설정 스토어
 * 내 채널(짐풀기) 기준 구독자 수 등 개인 설정을 localStorage에 저장한다.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  /** 내 채널 구독자 수 (기본: 짐풀기 276명) */
  myChannelSubscribers: number;
  /** 내 채널 구독자 수 설정 */
  setMyChannelSubscribers: (n: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      myChannelSubscribers: 276,
      setMyChannelSubscribers: (n) =>
        set({ myChannelSubscribers: Math.max(0, Math.floor(n) || 0) }),
    }),
    { name: "yt-trend-settings" }
  )
);
