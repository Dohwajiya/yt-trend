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
