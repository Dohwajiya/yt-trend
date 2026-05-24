/**
 * 짐풀기/설레짐 채널 니치 키워드 프리셋
 * 영감 발굴·키워드 분석 페이지에서 빠른 탐색용 칩으로 재사용한다
 */

/** 프리셋 키워드 그룹 */
export interface NichePresetGroup {
  /** 그룹명 (칩 카테고리 라벨) */
  label: string;
  /** 그룹에 속한 키워드 목록 */
  keywords: string[];
}

/** 짐풀기 콘텐츠·설레짐 브랜드 도메인 큐레이션 키워드 그룹 */
export const NICHE_PRESETS: NichePresetGroup[] = [
  {
    label: "챌린지",
    keywords: ["챌린지", "푸시업 챌린지", "길거리 챌린지", "도전 영상", "상금 챌린지"],
  },
  {
    label: "길거리 인터뷰",
    keywords: ["길거리 인터뷰", "대학교 인터뷰", "캠퍼스 인터뷰", "랜덤 인터뷰", "거리 인터뷰"],
  },
  {
    label: "운동·피트니스",
    keywords: ["운동 동기부여", "헬스 브이로그", "홈트레이닝", "푸시업", "맨몸운동"],
  },
  {
    label: "스포츠웨어",
    keywords: ["스포츠웨어", "운동복 추천", "헬스 패션", "짐웨어", "애슬레저"],
  },
];

/** 모든 프리셋 키워드를 평탄화한 목록 */
export const ALL_NICHE_KEYWORDS: string[] = NICHE_PRESETS.flatMap(
  (group) => group.keywords
);
