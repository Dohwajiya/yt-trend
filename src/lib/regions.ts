/**
 * 레퍼런스 수집 대상 국가 목록
 * 짐풀기 채널 기준 한국·미국·일본 3개국으로 제한한다.
 */

/** 국가(지역) 항목 */
export interface Region {
  /** YouTube 지역 코드 */
  value: string;
  /** 표시 라벨 */
  label: string;
}

/** 분석/레퍼런스에 사용하는 국가 (KR/US/JP) */
export const REGIONS: Region[] = [
  { value: "KR", label: "한국" },
  { value: "US", label: "미국" },
  { value: "JP", label: "일본" },
];

/**
 * 국가 코드에 대응하는 번역 대상 언어를 반환한다.
 * 한글 키워드를 해당 국가 언어로 자동 번역해 현지 레퍼런스를 검색하기 위함이다.
 *
 * @param regionCode - 국가 코드
 * @returns "en"(미국) | "ja"(일본) | null(한국 등 번역 불필요)
 */
export function regionTargetLang(regionCode: string): "en" | "ja" | null {
  if (regionCode === "US") return "en";
  if (regionCode === "JP") return "ja";
  return null;
}

