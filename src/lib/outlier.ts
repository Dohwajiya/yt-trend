/**
 * 아웃라이어(떡상) 분석 유틸리티
 * 구독자 수 대비 조회수 배수로 영상의 "떡상" 정도를 등급화한다.
 * 기존 calculateReaction(reaction.ts)을 보완하여 콘텐츠 영감 발굴에 사용한다.
 */

import type { OutlierTier } from "@/types/analysis";

/**
 * 아웃라이어 배수를 계산하는 함수
 * 조회수 ÷ 구독자 수 (구독자가 0이거나 비공개면 0 반환)
 *
 * @param viewCount - 영상 조회수
 * @param subscriberCount - 채널 구독자 수
 * @returns 배수 (예: 12.3 = 구독자의 12.3배가 조회)
 */
export function getOutlierMultiplier(
  viewCount: number,
  subscriberCount: number
): number {
  if (subscriberCount <= 0) return 0;
  return viewCount / subscriberCount;
}

/**
 * 배수에 따른 아웃라이어 등급을 반환하는 함수
 * 기준: 초대박 ≥10x, 떡상 ≥3x, 좋음 ≥1x, 평범 <1x
 *
 * @param multiplier - 아웃라이어 배수 (조회수 ÷ 구독자)
 * @returns 등급 라벨·이모지·색상 클래스
 */
export function getOutlierTier(multiplier: number): OutlierTier {
  if (multiplier >= 10) {
    return {
      level: "초대박",
      emoji: "🚀",
      colorClass: "bg-fuchsia-500/15 text-fuchsia-700 border-fuchsia-500/30",
    };
  }
  if (multiplier >= 3) {
    return {
      level: "떡상",
      emoji: "🔥",
      colorClass: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
    };
  }
  if (multiplier >= 1) {
    return {
      level: "좋음",
      emoji: "👍",
      colorClass: "bg-sky-500/15 text-sky-700 border-sky-500/30",
    };
  }
  return {
    level: "평범",
    emoji: "•",
    colorClass: "bg-gray-500/15 text-gray-600 border-gray-400/30",
  };
}

/**
 * 배수를 사람이 읽기 쉬운 문자열로 변환하는 함수
 * 예: 12.34 → "12.3x", 0.45 → "0.5x"
 *
 * @param multiplier - 아웃라이어 배수
 * @returns 포맷된 배수 문자열
 */
export function formatMultiplier(multiplier: number): string {
  return `${multiplier.toFixed(1)}x`;
}
