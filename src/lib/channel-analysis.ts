/**
 * 채널 분석 유틸리티
 * 채널 건강도 점수 산출, 예상 수익 계산 등
 */

import type {
  EnrichedVideo,
  ChannelHealthResult,
  RevenueEstimate,
} from "@/types/analysis";

/**
 * 값을 0~100 범위로 클램핑하는 헬퍼
 */
function clamp(value: number): number {
  return Math.min(100, Math.max(0, value));
}

/**
 * 채널 건강도 점수를 산출하는 함수 (0~100)
 *
 * 가중치:
 * - 평균 반응도 (40%): avgRatio를 정규화
 * - 업로드 빈도 (20%): 최근 30일 내 영상 수
 * - 구독자 대비 조회수 (20%): 총조회수 / 구독자수
 * - 참여도 (20%): (좋아요+댓글) / 조회수 평균
 *
 * @param videos - 최근 영상 목록
 * @param totalViewCount - 채널 총 조회수
 * @param subscriberCount - 채널 구독자 수
 * @returns 건강도 점수와 세부 항목
 */
export function calculateChannelHealth(
  videos: EnrichedVideo[],
  totalViewCount: number,
  subscriberCount: number
): ChannelHealthResult {
  if (videos.length === 0) {
    return {
      totalScore: 0,
      breakdown: {
        reactionScore: 0,
        uploadFrequencyScore: 0,
        viewSubscriberRatioScore: 0,
        engagementScore: 0,
      },
    };
  }

  // 1. 평균 반응도 (40%)
  // ratio >= 0.5 → 100점, ratio <= 0.05 → 0점
  const avgRatio =
    videos.reduce((sum, v) => sum + v.reaction.ratio, 0) / videos.length;
  const reactionScore = clamp(((avgRatio - 0.05) / 0.45) * 100);

  // 2. 업로드 빈도 (20%)
  // 최근 30일 내 영상 수 기준: 8개 이상 → 100점
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentVideos = videos.filter(
    (v) => new Date(v.publishedAt) >= thirtyDaysAgo
  );
  const uploadFrequencyScore = clamp((recentVideos.length / 8) * 100);

  // 3. 구독자 대비 총 조회수 (20%)
  // ratio >= 100 → 100점, ratio <= 1 → 0점
  let viewSubscriberRatioScore = 0;
  if (subscriberCount > 0) {
    const vsRatio = totalViewCount / subscriberCount;
    viewSubscriberRatioScore = clamp(((vsRatio - 1) / 99) * 100);
  }

  // 4. 참여도 (20%)
  // (좋아요+댓글) / 조회수 평균: ratio >= 0.08 → 100점
  const engagementRatios = videos
    .filter((v) => v.viewCount > 0)
    .map((v) => (v.likeCount + v.commentCount) / v.viewCount);
  const avgEngagement =
    engagementRatios.length > 0
      ? engagementRatios.reduce((a, b) => a + b, 0) / engagementRatios.length
      : 0;
  const engagementScore = clamp((avgEngagement / 0.08) * 100);

  // 가중 합산
  const totalScore = Math.round(
    reactionScore * 0.4 +
      uploadFrequencyScore * 0.2 +
      viewSubscriberRatioScore * 0.2 +
      engagementScore * 0.2
  );

  return {
    totalScore,
    breakdown: {
      reactionScore: Math.round(reactionScore),
      uploadFrequencyScore: Math.round(uploadFrequencyScore),
      viewSubscriberRatioScore: Math.round(viewSubscriberRatioScore),
      engagementScore: Math.round(engagementScore),
    },
  };
}

/**
 * 예상 월 수익을 계산하는 함수
 * CPM(1000회 당 수익) $1~$5 범위를 기준으로 추정
 *
 * @param monthlyViews - 월 평균 조회수
 * @returns 최소~최대 예상 수익 (USD)
 */
export function estimateRevenue(monthlyViews: number): RevenueEstimate {
  return {
    min: Math.round((monthlyViews / 1000) * 1),
    max: Math.round((monthlyViews / 1000) * 5),
  };
}

/**
 * 최근 영상들의 월 평균 조회수를 추정하는 함수
 *
 * @param videos - 최근 영상 목록
 * @returns 추정 월 평균 조회수
 */
export function estimateMonthlyViews(videos: EnrichedVideo[]): number {
  if (videos.length === 0) return 0;

  // 최근 30일 이내 영상의 총 조회수를 월 조회수로 추정
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentVideos = videos.filter(
    (v) => new Date(v.publishedAt) >= thirtyDaysAgo
  );

  if (recentVideos.length === 0) {
    // 30일 이내 영상이 없으면 전체 평균으로 추정
    const avgViews =
      videos.reduce((sum, v) => sum + v.viewCount, 0) / videos.length;
    return Math.round(avgViews * 4); // 월 4개 영상 가정
  }

  return recentVideos.reduce((sum, v) => sum + v.viewCount, 0);
}
