/**
 * 분석 결과 타입 정의
 * YouTube 데이터를 가공한 후의 분석 결과 타입
 */

/** 반응도 등급 (구독자 대비 조회수 비율) */
export type ReactionGrade = "Good" | "Normal" | "Bad";

/** 반응도 분석 결과 */
export interface ReactionResult {
  /** 반응도 등급 */
  grade: ReactionGrade;
  /** 조회수 / 구독자 수 비율 */
  ratio: number;
}

/** 영상 타입 필터 */
export type VideoTypeFilter = "all" | "regular" | "shorts";

/**
 * 합산된 영상 데이터 (UI에서 사용하는 최종 형태)
 * YouTube API의 search + videos + channels 데이터를 합쳐서 반응도까지 계산한 결과
 */
export interface EnrichedVideo {
  /** 영상 ID */
  videoId: string;
  /** 영상 제목 */
  title: string;
  /** 영상 썸네일 URL */
  thumbnailUrl: string;
  /** 채널 ID */
  channelId: string;
  /** 채널명 */
  channelTitle: string;
  /** 채널 프로필 이미지 URL */
  channelThumbnailUrl: string;
  /** 게시 일시 (ISO 8601) */
  publishedAt: string;
  /** 조회수 */
  viewCount: number;
  /** 좋아요 수 */
  likeCount: number;
  /** 댓글 수 */
  commentCount: number;
  /** 채널 구독자 수 */
  subscriberCount: number;
  /** 영상 길이 (ISO 8601, 예: "PT4M13S") */
  duration: string;
  /** 쇼츠 여부 (60초 이하) */
  isShorts: boolean;
  /** 반응도 분석 결과 */
  reaction: ReactionResult;
}

/** 검색 API 응답 (클라이언트에서 사용) */
export interface SearchApiResponse {
  /** 분석된 영상 목록 */
  items: EnrichedVideo[];
  /** 다음 페이지 토큰 (더 불러오기 용) */
  nextPageToken: string | null;
  /** 전체 결과 수 */
  totalResults: number;
}

/** 검색 API 요청 파라미터 */
export interface SearchApiRequest {
  /** 검색 키워드 */
  keyword: string;
  /** 지역 코드 (기본: KR) */
  regionCode?: string;
  /** 다음 페이지 토큰 */
  pageToken?: string;
  /** 최대 결과 수 (기본: 25) */
  maxResults?: number;
}

/** 채널 분석 데이터 (채널 찾기에서 사용) */
export interface ChannelAnalysis {
  /** 채널 ID */
  channelId: string;
  /** 채널명 */
  channelTitle: string;
  /** 채널 프로필 이미지 URL */
  channelThumbnailUrl: string;
  /** 구독자 수 */
  subscriberCount: number;
  /** 검색 결과 내 영상 수 */
  videoCount: number;
  /** 평균 반응도 비율 */
  avgReactionRatio: number;
  /** 평균 반응도 등급 */
  avgReactionGrade: ReactionGrade;
  /** 최신 영상 게시일 */
  latestPublishedAt: string;
}

/** 채널 상세 통계 (채널 분석 강화용) */
export interface ChannelDetailStats {
  /** 구독자 수 */
  subscriberCount: number;
  /** 총 조회수 */
  totalViewCount: number;
  /** 총 영상 수 */
  totalVideoCount: number;
  /** 채널명 */
  channelTitle: string;
  /** 채널 프로필 이미지 URL */
  channelThumbnailUrl: string;
  /** 채널 설명 */
  description: string;
}

/** 채널 건강도 점수 상세 항목 */
export interface HealthBreakdown {
  /** 평균 반응도 점수 (0~100) */
  reactionScore: number;
  /** 업로드 빈도 점수 (0~100) */
  uploadFrequencyScore: number;
  /** 구독자 대비 조회수 점수 (0~100) */
  viewSubscriberRatioScore: number;
  /** 참여도 점수 (0~100) */
  engagementScore: number;
}

/** 채널 건강도 분석 결과 */
export interface ChannelHealthResult {
  /** 종합 점수 (0~100) */
  totalScore: number;
  /** 세부 항목 점수 */
  breakdown: HealthBreakdown;
}

/** 예상 수익 범위 */
export interface RevenueEstimate {
  /** 최소 예상 월 수익 (USD) */
  min: number;
  /** 최대 예상 월 수익 (USD) */
  max: number;
}

/** 채널 비교 API 응답의 한쪽 채널 데이터 */
export interface CompareChannelData {
  /** 채널 통계 */
  stats: ChannelDetailStats;
  /** 최근 영상 목록 */
  videos: EnrichedVideo[];
  /** 건강도 점수 */
  health: ChannelHealthResult;
  /** 예상 수익 */
  revenue: RevenueEstimate;
}

/** 채널 비교 API 응답 */
export interface CompareApiResponse {
  channelA: CompareChannelData;
  channelB: CompareChannelData;
}

/** 검색 히스토리 항목 */
export interface SearchHistoryItem {
  /** 검색 키워드 */
  keyword: string;
  /** 검색 시각 (ISO 8601) */
  timestamp: string;
  /** 결과 수 */
  resultCount: number;
}

/** 반응도 분포 데이터 */
export interface ReactionDistribution {
  good: number;
  normal: number;
  bad: number;
}

/** 키워드 경쟁도 분석 결과 */
export interface CompetitionResult {
  /** 경쟁도 점수 (0~100) */
  score: number;
  /** 경쟁도 등급 */
  level: "낮음" | "보통" | "높음";
}

/** YouTube 영상 카테고리 */
export interface VideoCategory {
  id: string;
  label: string;
}

/** 아웃라이어(떡상) 등급 라벨 */
export type OutlierTierLevel = "초대박" | "떡상" | "좋음" | "평범";

/** 아웃라이어 등급 정보 (배수 기반) */
export interface OutlierTier {
  /** 등급 라벨 */
  level: OutlierTierLevel;
  /** 표시용 이모지 */
  emoji: string;
  /** Tailwind 색상 클래스 */
  colorClass: string;
}

/** 경쟁 채널 경량 통계 스냅샷 (channels.list 배치 조회 결과) */
export interface CompetitorSnapshot {
  /** 채널 ID */
  channelId: string;
  /** 채널명 */
  channelTitle: string;
  /** 채널 프로필 이미지 URL */
  channelThumbnailUrl: string;
  /** 구독자 수 */
  subscriberCount: number;
  /** 채널 총 조회수 */
  totalViewCount: number;
  /** 채널 총 영상 수 */
  totalVideoCount: number;
  /** 영상당 평균 조회수 (총조회수 ÷ 영상수) */
  avgViewsPerVideo: number;
  /** 채널 평균 반응도 비율 (영상당 평균조회수 ÷ 구독자) */
  avgReactionRatio: number;
}

/** 키워드 비교 분석 결과 (멀티 키워드 비교용) */
export interface KeywordComparison {
  /** 키워드 */
  keyword: string;
  /** 검색 결과 총 수 */
  totalResults: number;
  /** 경쟁도 점수 (0~100) */
  competitionScore: number;
  /** 경쟁도 등급 */
  competitionLevel: "낮음" | "보통" | "높음";
  /** 분석 영상 평균 반응도 비율 */
  avgReactionRatio: number;
  /** 기회 점수 (0~100) */
  opportunityScore: number;
}

/** 키워드 기회 점수 결과 (수요 대비 경쟁) */
export interface OpportunityResult {
  /** 기회 점수 (0~100) */
  score: number;
  /** 기회 등급 */
  level: "낮음" | "보통" | "높음";
}

/** 영상 댓글 항목 (인기 댓글) */
export interface CommentItem {
  /** 댓글 ID */
  id: string;
  /** 작성자 표시명 */
  author: string;
  /** 작성자 프로필 이미지 URL */
  authorProfileImageUrl: string;
  /** 댓글 본문 (HTML 제거된 텍스트) */
  text: string;
  /** 좋아요 수 */
  likeCount: number;
  /** 작성 일시 (ISO 8601) */
  publishedAt: string;
}

/** 키워드 빈도 항목 */
export interface KeywordCount {
  /** 단어 */
  word: string;
  /** 등장 횟수 */
  count: number;
}

/** 떡상 영상 묶음의 공통 패턴 분석 결과 */
export interface OutlierPatterns {
  /** 분석 대상 영상 수 */
  count: number;
  /** 제목 키워드 빈도 TOP */
  topKeywords: KeywordCount[];
  /** 쇼츠 비율 (0~1) */
  shortsRatio: number;
  /** 평균 영상 길이 (초) */
  avgDurationSec: number;
  /** 평균 제목 글자수 */
  avgTitleLength: number;
  /** 최근 30일 업로드 비율 (0~1) */
  recentRatio: number;
  /** 아웃라이어 배수 중앙값 */
  medianMultiplier: number;
}
