/**
 * 키워드 분석 유틸리티
 * 경쟁도 점수 산출, 반응도 분포 계산 등 키워드 관련 분석 로직
 */

import type {
  CompetitionResult,
  ReactionDistribution,
  EnrichedVideo,
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
