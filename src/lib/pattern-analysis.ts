/**
 * 떡상 영상 패턴 분석 유틸리티
 * 발굴된 아웃라이어 영상 묶음에서 "왜 떴는지" 단서가 되는 공통점
 * (제목 키워드 빈도, 쇼츠 비율, 길이, 최신성 등)을 클라이언트에서 계산한다.
 */

import type { EnrichedVideo, OutlierPatterns, KeywordCount } from "@/types/analysis";
import { parseDurationToSeconds } from "@/lib/format";
import { getOutlierMultiplier } from "@/lib/outlier";

/**
 * 제목 키워드 분석에서 제외할 한국어/영어 불용어
 * (의미 없는 빈출어를 걸러 시그널을 키운다)
 */
const STOPWORDS = new Set([
  // 한국어
  "영상", "채널", "구독", "좋아요", "진짜", "정말", "그냥", "이거", "근데",
  "너무", "완전", "하는", "했는데", "합니다", "입니다", "있는", "없는",
  "그리고", "하지만", "오늘", "우리", "사람", "느낌",
  // 영어
  "ep", "the", "and", "for", "you", "your", "with", "this", "that",
  "vlog", "official", "feat",
  // 일본어 (조사·흔한 어미/대명사)
  "する", "した", "して", "です", "ます", "ない", "いる", "これ", "それ",
  "この", "その", "あの", "こと", "もの", "ため", "という", "さん", "ちゃん",
]);

/**
 * 제목 문자열을 토큰으로 분리하는 함수
 * 한글/영문/숫자만 남기고 2자 이상, 불용어가 아닌 토큰만 반환한다.
 * (형태소 분석이 아닌 단순 빈도 휴리스틱)
 *
 * @param title - 영상 제목
 * @returns 정제된 토큰 배열
 */
function tokenize(title: string): string[] {
  // 한글·영문·숫자 + 일본어(히라가나·가타카나·한자)만 남긴다
  return title
    .toLowerCase()
    .replace(/[^가-힣a-z0-9぀-ヿ一-鿿]+/g, " ")
    .split(" ")
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

/**
 * 숫자 배열의 중앙값을 구하는 함수
 */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * 떡상 영상 묶음의 공통 패턴을 분석하는 함수
 *
 * @param videos - 분석 대상 영상 목록 (필터·정렬된 결과)
 * @returns 키워드 빈도·쇼츠 비율·평균 길이·최신성·중앙 배수
 */
export function analyzeOutlierPatterns(
  videos: EnrichedVideo[]
): OutlierPatterns {
  const count = videos.length;
  if (count === 0) {
    return {
      count: 0,
      topKeywords: [],
      shortsRatio: 0,
      avgDurationSec: 0,
      avgTitleLength: 0,
      recentRatio: 0,
      medianMultiplier: 0,
    };
  }

  // 제목 키워드 빈도 집계
  const freq = new Map<string, number>();
  for (const v of videos) {
    // 한 영상 내 중복 토큰은 1회만 카운트 (영상 단위 등장 빈도)
    const unique = new Set(tokenize(v.title));
    for (const word of unique) {
      freq.set(word, (freq.get(word) ?? 0) + 1);
    }
  }
  const topKeywords: KeywordCount[] = [...freq.entries()]
    .map(([word, c]) => ({ word, count: c }))
    .filter((k) => k.count >= 2) // 2개 이상 영상에 등장한 키워드만
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  // 쇼츠 비율
  const shortsRatio = videos.filter((v) => v.isShorts).length / count;

  // 평균 길이 / 제목 글자수
  const avgDurationSec = Math.round(
    videos.reduce((s, v) => s + parseDurationToSeconds(v.duration), 0) / count
  );
  const avgTitleLength = Math.round(
    videos.reduce((s, v) => s + v.title.length, 0) / count
  );

  // 최근 30일 업로드 비율
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentRatio =
    videos.filter((v) => new Date(v.publishedAt) >= thirtyDaysAgo).length /
    count;

  // 배수 중앙값 (구독자 공개 영상만)
  const multipliers = videos
    .filter((v) => v.subscriberCount > 0)
    .map((v) => getOutlierMultiplier(v.viewCount, v.subscriberCount));
  const medianMultiplier = median(multipliers);

  return {
    count,
    topKeywords,
    shortsRatio,
    avgDurationSec,
    avgTitleLength,
    recentRatio,
    medianMultiplier,
  };
}
