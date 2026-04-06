/**
 * 반응도 계산 모듈
 * 구독자 수 대비 조회수 비율로 영상의 반응도를 Good/Normal/Bad로 판정
 */

import type { ReactionGrade, ReactionResult } from "@/types/analysis";

/**
 * 개별 영상의 반응도를 계산하는 함수
 * 조회수 / 구독자 수 비율로 등급을 판정한다
 *
 * @param viewCount - 영상 조회수
 * @param subscriberCount - 채널 구독자 수
 * @returns 반응도 등급과 비율
 *
 * 기준:
 * - Good: ratio >= 0.3 (조회수가 구독자의 30% 이상 → 알고리즘 추천 가능성 높음)
 * - Normal: 0.1 <= ratio < 0.3 (일반적인 성과)
 * - Bad: ratio < 0.1 (저조한 반응)
 */
export function calculateReaction(
  viewCount: number,
  subscriberCount: number
): ReactionResult {
  // 구독자 수가 0이거나 비공개인 경우 비율 계산 불가
  if (subscriberCount <= 0) {
    return { grade: "Normal", ratio: 0 };
  }

  const ratio = viewCount / subscriberCount;

  let grade: ReactionGrade;
  if (ratio >= 0.3) {
    grade = "Good";
  } else if (ratio >= 0.1) {
    grade = "Normal";
  } else {
    grade = "Bad";
  }

  return { grade, ratio };
}

/**
 * 반응도 등급에 따른 색상 클래스를 반환하는 함수
 *
 * @param grade - 반응도 등급
 * @returns Tailwind CSS 클래스 문자열
 */
export function getReactionColorClass(grade: ReactionGrade): string {
  switch (grade) {
    case "Good":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "Normal":
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    case "Bad":
      return "bg-red-500/20 text-red-400 border-red-500/30";
  }
}
