/**
 * YouTube Data API v3 응답 타입 정의
 * YouTube API에서 반환하는 데이터 구조를 TypeScript 타입으로 정의
 */

/** YouTube API 공통 페이지네이션 응답 */
interface YouTubePageInfo {
  /** 전체 결과 수 */
  totalResults: number;
  /** 페이지당 결과 수 */
  resultsPerPage: number;
}

/** 썸네일 정보 */
interface YouTubeThumbnail {
  /** 이미지 URL */
  url: string;
  /** 이미지 너비 */
  width: number;
  /** 이미지 높이 */
  height: number;
}

/** 썸네일 모음 (해상도별) */
interface YouTubeThumbnails {
  default: YouTubeThumbnail;
  medium: YouTubeThumbnail;
  high: YouTubeThumbnail;
  standard?: YouTubeThumbnail;
  maxres?: YouTubeThumbnail;
}

// ========== search.list 응답 ==========

/** search.list API 응답의 개별 항목 */
export interface YouTubeSearchItem {
  /** 영상 ID 정보 */
  id: {
    kind: string;
    videoId: string;
  };
  /** 영상 기본 정보 */
  snippet: {
    /** 게시 일시 (ISO 8601) */
    publishedAt: string;
    /** 채널 ID */
    channelId: string;
    /** 영상 제목 */
    title: string;
    /** 영상 설명 */
    description: string;
    /** 썸네일 이미지 */
    thumbnails: YouTubeThumbnails;
    /** 채널명 */
    channelTitle: string;
  };
}

/** search.list API 전체 응답 */
export interface YouTubeSearchResponse {
  /** 다음 페이지 토큰 */
  nextPageToken?: string;
  /** 페이지 정보 */
  pageInfo: YouTubePageInfo;
  /** 검색 결과 목록 */
  items: YouTubeSearchItem[];
}

// ========== videos.list 응답 ==========

/** videos.list API 응답의 개별 항목 */
export interface YouTubeVideoItem {
  /** 영상 ID */
  id: string;
  /** 영상 기본 정보 */
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: YouTubeThumbnails;
    channelTitle: string;
  };
  /** 영상 통계 정보 */
  statistics: {
    /** 조회수 */
    viewCount: string;
    /** 좋아요 수 */
    likeCount: string;
    /** 댓글 수 */
    commentCount: string;
  };
  /** 영상 상세 정보 */
  contentDetails: {
    /** 영상 길이 (ISO 8601, 예: "PT4M13S") */
    duration: string;
  };
}

/** videos.list API 전체 응답 */
export interface YouTubeVideoResponse {
  items: YouTubeVideoItem[];
}

// ========== channels.list 응답 ==========

/** channels.list API 응답의 개별 항목 */
export interface YouTubeChannelItem {
  /** 채널 ID */
  id: string;
  /** 채널 기본 정보 */
  snippet: {
    title: string;
    description: string;
    thumbnails: YouTubeThumbnails;
  };
  /** 채널 통계 정보 */
  statistics: {
    /** 구독자 수 */
    subscriberCount: string;
    /** 총 영상 수 */
    videoCount: string;
    /** 총 조회수 */
    viewCount: string;
    /** 구독자 수 비공개 여부 */
    hiddenSubscriberCount: boolean;
  };
}

/** channels.list API 전체 응답 */
export interface YouTubeChannelResponse {
  items: YouTubeChannelItem[];
}
