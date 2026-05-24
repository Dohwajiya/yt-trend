/**
 * 키워드 분석 유틸리티
 * 경쟁도 점수 산출, 반응도 분포 계산 등 키워드 관련 분석 로직
 */

import type {
  CompetitionResult,
  ReactionDistribution,
  EnrichedVideo,
  OpportunityResult,
} from "@/types/analysis";

/**
 * 키워드 경쟁도 점수를 산출하는 함수
 * 검색 결과 수(totalResults)를 기반으로 0~100 점수를 계산
 *
 * @param totalResults - YouTube 검색 결과 수
 * @returns 경쟁도 점수와 등급
 */
export function calculateCompetitionScore(
  totalResults: number
): CompetitionResult {
  // 정규화: 로그 스케일로 0~100 범위에 매핑
  // 10만 이하 → 낮음, 10만~100만 → 보통, 100만 이상 → 높음
  let score: number;

  if (totalResults <= 0) {
    score = 0;
  } else {
    // log10(totalResults)를 0~100으로 매핑 (3=1000 → 0, 7=10M → 100)
    const logVal = Math.log10(totalResults);
    score = Math.min(100, Math.max(0, ((logVal - 3) / 4) * 100));
  }

  let level: "낮음" | "보통" | "높음";
  if (score < 33) {
    level = "낮음";
  } else if (score < 66) {
    level = "보통";
  } else {
    level = "높음";
  }

  return { score: Math.round(score), level };
}

/**
 * 영상 목록에서 반응도 분포를 계산하는 함수
 *
 * @param videos - 분석할 영상 목록
 * @returns Good/Normal/Bad 각 개수
 */
export function calculateReactionDistribution(
  videos: EnrichedVideo[]
): ReactionDistribution {
  return {
    good: videos.filter((v) => v.reaction.grade === "Good").length,
    normal: videos.filter((v) => v.reaction.grade === "Normal").length,
    bad: videos.filter((v) => v.reaction.grade === "Bad").length,
  };
}

/**
 * 영상 목록의 평균 반응도 비율을 계산하는 함수
 * 구독자 수가 0(비공개)인 영상은 평균에서 제외한다
 *
 * @param videos - 분석할 영상 목록
 * @returns 평균 반응도 비율 (유효 영상이 없으면 0)
 */
export function calculateAverageReactionRatio(
  videos: EnrichedVideo[]
): number {
  const valid = videos.filter((v) => v.subscriberCount > 0);
  if (valid.length === 0) return 0;
  return valid.reduce((sum, v) => sum + v.reaction.ratio, 0) / valid.length;
}

/**
 * 키워드 기회 점수를 산출하는 함수
 * 반응(수요)이 높고 경쟁이 낮을수록 높은 점수를 부여한다.
 *
 * @param competitionScore - 경쟁도 점수 (0~100)
 * @param avgReactionRatio - 분석 영상 평균 반응도 비율
 * @returns 기회 점수와 등급
 *
 * 계산: 수요 점수(평균 반응도 0.5면 만점) 50% + 저경쟁(100-경쟁도) 50%
 */
export function calculateOpportunityScore(
  competitionScore: number,
  avgReactionRatio: number
): OpportunityResult {
  // 수요 점수: 평균 반응도가 0.5(구독자의 50%)면 100점
  const demandScore = Math.min(
    100,
    Math.max(0, (avgReactionRatio / 0.5) * 100)
  );

  const score = Math.round(
    Math.min(
      100,
      Math.max(0, demandScore * 0.5 + (100 - competitionScore) * 0.5)
    )
  );

  let level: "낮음" | "보통" | "높음";
  if (score < 40) {
    level = "낮음";
  } else if (score < 70) {
    level = "보통";
  } else {
    level = "높음";
  }

  return { score, level };
}
