/**
 * YouTube Data API v3 래퍼 모듈
 * 검색 → 영상 상세 → 채널 정보 3단계 파이프라인을 통합하여
 * 한 번의 호출로 분석에 필요한 모든 데이터를 수집한다
 */

import type {
  YouTubeSearchResponse,
  YouTubeVideoResponse,
  YouTubeChannelResponse,
} from "@/types/youtube";
import type { EnrichedVideo, SearchApiResponse, ChannelDetailStats } from "@/types/analysis";
import { calculateReaction } from "@/lib/reaction";
import { isShorts } from "@/lib/format";

/** YouTube Data API v3 기본 URL */
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

/**
 * YouTube API 키를 환경변수에서 가져오는 함수
 * 서버 사이드에서만 호출되어야 한다
 */
function getApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    throw new Error("YOUTUBE_API_KEY 환경변수가 설정되지 않았습니다.");
  }
  return key;
}

/**
 * 1단계: 키워드로 영상을 검색하는 함수 (search.list)
 * Quota 소비: 100유닛/호출
 *
 * @param keyword - 검색 키워드
 * @param regionCode - 지역 코드 (기본: KR)
 * @param maxResults - 최대 결과 수 (기본: 25, 최대: 50)
 * @param pageToken - 다음 페이지 토큰
 * @returns 검색 결과 (영상 ID 목록 포함)
 */
async function searchVideos(
  keyword: string,
  regionCode: string = "KR",
  maxResults: number = 25,
  pageToken?: string
): Promise<YouTubeSearchResponse> {
  const params = new URLSearchParams({
    part: "snippet",
    q: keyword,
    type: "video",
    regionCode,
    maxResults: String(maxResults),
    key: getApiKey(),
    order: "relevance",
  });

  if (pageToken) {
    params.set("pageToken", pageToken);
  }

  const response = await fetch(`${YOUTUBE_API_BASE}/search?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `YouTube 검색 API 오류: ${error.error?.message ?? response.statusText}`
    );
  }

  return response.json();
}

/**
 * 2단계: 영상 ID 목록으로 상세 정보를 조회하는 함수 (videos.list)
 * Quota 소비: 1유닛/호출 (최대 50개 ID를 한 번에 조회 가능)
 *
 * @param videoIds - 영상 ID 배열
 * @returns 영상 상세 정보 (조회수, 좋아요, 길이 등)
 */
async function getVideoDetails(
  videoIds: string[]
): Promise<YouTubeVideoResponse> {
  if (videoIds.length === 0) {
    return { items: [] };
  }

  const params = new URLSearchParams({
    part: "snippet,statistics,contentDetails",
    id: videoIds.join(","),
    key: getApiKey(),
  });

  const response = await fetch(`${YOUTUBE_API_BASE}/videos?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `YouTube 영상 API 오류: ${error.error?.message ?? response.statusText}`
    );
  }

  return response.json();
}

/**
 * 3단계: 채널 ID 목록으로 채널 정보를 조회하는 함수 (channels.list)
 * Quota 소비: 1유닛/호출 (최대 50개 ID를 한 번에 조회 가능)
 *
 * @param channelIds - 채널 ID 배열
 * @returns 채널 정보 (구독자 수 등)
 */
async function getChannelDetails(
  channelIds: string[]
): Promise<YouTubeChannelResponse> {
  if (channelIds.length === 0) {
    return { items: [] };
  }

  // 중복 채널 ID 제거
  const uniqueIds = [...new Set(channelIds)];

  const params = new URLSearchParams({
    part: "snippet,statistics",
    id: uniqueIds.join(","),
    key: getApiKey(),
  });

  const response = await fetch(`${YOUTUBE_API_BASE}/channels?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `YouTube 채널 API 오류: ${error.error?.message ?? response.statusText}`
    );
  }

  return response.json();
}

/**
 * 3단계 파이프라인 통합 함수
 * search → videos → channels 순서로 호출한 뒤,
 * 데이터를 합산하고 반응도를 계산하여 EnrichedVideo 배열로 반환
 *
 * @param keyword - 검색 키워드
 * @param regionCode - 지역 코드 (기본: KR)
 * @param maxResults - 최대 결과 수 (기본: 25)
 * @param pageToken - 다음 페이지 토큰
 * @returns 분석된 영상 목록 + 페이지 정보
 */
export async function searchAndAnalyze(
  keyword: string,
  regionCode: string = "KR",
  maxResults: number = 25,
  pageToken?: string
): Promise<SearchApiResponse> {
  // 1단계: 키워드 검색으로 영상 ID 수집
  const searchResult = await searchVideos(
    keyword,
    regionCode,
    maxResults,
    pageToken
  );

  const videoIds = searchResult.items.map((item) => item.id.videoId);

  if (videoIds.length === 0) {
    return {
      items: [],
      nextPageToken: null,
      totalResults: 0,
    };
  }

  // 2단계 & 3단계: 영상 상세 + 채널 정보를 병렬로 조회
  const channelIds = searchResult.items.map(
    (item) => item.snippet.channelId
  );

  const [videoDetails, channelDetails] = await Promise.all([
    getVideoDetails(videoIds),
    getChannelDetails(channelIds),
  ]);

  // 빠른 조회를 위해 Map으로 변환
  const videoMap = new Map(
    videoDetails.items.map((v) => [v.id, v])
  );
  const channelMap = new Map(
    channelDetails.items.map((c) => [c.id, c])
  );

  // 데이터 합산: search + video + channel → EnrichedVideo
  const enrichedVideos: EnrichedVideo[] = searchResult.items
    .map((searchItem) => {
      const video = videoMap.get(searchItem.id.videoId);
      const channel = channelMap.get(searchItem.snippet.channelId);

      // 영상 상세 정보가 없으면 건너뛰기
      if (!video) return null;

      const viewCount = parseInt(video.statistics.viewCount ?? "0");
      const subscriberCount = parseInt(
        channel?.statistics.subscriberCount ?? "0"
      );

      // 반응도 계산
      const reaction = calculateReaction(viewCount, subscriberCount);

      return {
        videoId: searchItem.id.videoId,
        title: video.snippet.title,
        thumbnailUrl:
          video.snippet.thumbnails.medium?.url ??
          video.snippet.thumbnails.default.url,
        channelId: searchItem.snippet.channelId,
        channelTitle: video.snippet.channelTitle,
        channelThumbnailUrl:
          channel?.snippet.thumbnails.default?.url ?? "",
        publishedAt: video.snippet.publishedAt,
        viewCount,
        likeCount: parseInt(video.statistics.likeCount ?? "0"),
        commentCount: parseInt(video.statistics.commentCount ?? "0"),
        subscriberCount,
        duration: video.contentDetails.duration,
        isShorts: isShorts(video.contentDetails.duration, video.snippet.title),
        reaction,
      } satisfies EnrichedVideo;
    })
    .filter((v): v is EnrichedVideo => v !== null);

  return {
    items: enrichedVideos,
    nextPageToken: searchResult.nextPageToken ?? null,
    totalResults: searchResult.pageInfo.totalResults,
  };
}

/** 채널 영상 조회 응답 (채널 통계 포함) */
export interface ChannelVideosResponse extends SearchApiResponse {
  channelStats: ChannelDetailStats | null;
}

/**
 * 특정 채널의 최근 영상 + 채널 통계를 함께 반환하는 함수
 */
export async function getChannelVideosWithStats(
  channelId: string,
  maxResults: number = 30
): Promise<ChannelVideosResponse> {
  const result = await getChannelVideos(channelId, maxResults);
  const channelDetails = await getChannelDetails([channelId]);
  const ch = channelDetails.items[0];

  const channelStats: ChannelDetailStats | null = ch
    ? {
        subscriberCount: parseInt(ch.statistics.subscriberCount ?? "0"),
        totalViewCount: parseInt(ch.statistics.viewCount ?? "0"),
        totalVideoCount: parseInt(ch.statistics.videoCount ?? "0"),
        channelTitle: ch.snippet.title,
        channelThumbnailUrl: ch.snippet.thumbnails.default?.url ?? "",
        description: ch.snippet.description,
      }
    : null;

  return { ...result, channelStats };
}

/**
 * 트렌딩(인기) 영상을 가져오는 함수
 * videos.list?chart=mostPopular 활용, Quota: 2유닛
 */
export async function getTrendingVideos(
  regionCode: string = "KR",
  categoryId: string = "0",
  maxResults: number = 20
): Promise<SearchApiResponse> {
  const params = new URLSearchParams({
    part: "snippet,statistics,contentDetails",
    chart: "mostPopular",
    regionCode,
    maxResults: String(maxResults),
    key: getApiKey(),
  });
  if (categoryId !== "0") params.set("videoCategoryId", categoryId);

  const response = await fetch(`${YOUTUBE_API_BASE}/videos?${params}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`YouTube 트렌딩 API 오류: ${error.error?.message ?? response.statusText}`);
  }

  const data = await response.json();
  const channelIds: string[] = data.items.map(
    (v: { snippet: { channelId: string } }) => v.snippet.channelId
  );
  const chDetails = await getChannelDetails(channelIds);
  const chMap = new Map(chDetails.items.map((c) => [c.id, c]));

  interface RawVideo {
    id: string;
    snippet: { title: string; channelId: string; channelTitle: string; publishedAt: string; thumbnails: { medium?: { url: string }; default: { url: string } } };
    statistics: { viewCount?: string; likeCount?: string; commentCount?: string };
    contentDetails: { duration: string };
  }

  const items: EnrichedVideo[] = (data.items as RawVideo[]).map((v) => {
    const ch = chMap.get(v.snippet.channelId);
    const viewCount = parseInt(v.statistics.viewCount ?? "0");
    const subCount = parseInt(ch?.statistics.subscriberCount ?? "0");
    return {
      videoId: v.id,
      title: v.snippet.title,
      thumbnailUrl: v.snippet.thumbnails.medium?.url ?? v.snippet.thumbnails.default.url,
      channelId: v.snippet.channelId,
      channelTitle: v.snippet.channelTitle,
      channelThumbnailUrl: ch?.snippet.thumbnails.default?.url ?? "",
      publishedAt: v.snippet.publishedAt,
      viewCount,
      likeCount: parseInt(v.statistics.likeCount ?? "0"),
      commentCount: parseInt(v.statistics.commentCount ?? "0"),
      subscriberCount: subCount,
      duration: v.contentDetails.duration,
      isShorts: isShorts(v.contentDetails.duration, v.snippet.title),
      reaction: calculateReaction(viewCount, subCount),
    } satisfies EnrichedVideo;
  });

  return { items, nextPageToken: null, totalResults: items.length };
}

/**
 * 특정 채널의 최근 영상을 검색하는 함수
 * 채널 분석 페이지에서 사용
 *
 * @param channelId - YouTube 채널 ID
 * @param maxResults - 최대 결과 수 (기본: 30)
 * @returns 분석된 영상 목록
 */
export async function getChannelVideos(
  channelId: string,
  maxResults: number = 30
): Promise<SearchApiResponse> {
  const params = new URLSearchParams({
    part: "snippet",
    channelId,
    type: "video",
    order: "date",
    maxResults: String(maxResults),
    key: getApiKey(),
  });

  const response = await fetch(`${YOUTUBE_API_BASE}/search?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `YouTube 채널 영상 검색 오류: ${error.error?.message ?? response.statusText}`
    );
  }

  const searchResult: YouTubeSearchResponse = await response.json();
  const videoIds = searchResult.items.map((item) => item.id.videoId);

  if (videoIds.length === 0) {
    return { items: [], nextPageToken: null, totalResults: 0 };
  }

  // 영상 상세 + 채널 정보 병렬 조회
  const [videoDetails, channelDetails] = await Promise.all([
    getVideoDetails(videoIds),
    getChannelDetails([channelId]),
  ]);

  const videoMap = new Map(
    videoDetails.items.map((v) => [v.id, v])
  );
  const channel = channelDetails.items[0];

  const subscriberCount = parseInt(
    channel?.statistics.subscriberCount ?? "0"
  );

  const enrichedVideos: EnrichedVideo[] = searchResult.items
    .map((searchItem) => {
      const video = videoMap.get(searchItem.id.videoId);
      if (!video) return null;

      const viewCount = parseInt(video.statistics.viewCount ?? "0");
      const reaction = calculateReaction(viewCount, subscriberCount);

      return {
        videoId: searchItem.id.videoId,
        title: video.snippet.title,
        thumbnailUrl:
          video.snippet.thumbnails.medium?.url ??
          video.snippet.thumbnails.default.url,
        channelId,
        channelTitle: video.snippet.channelTitle,
        channelThumbnailUrl:
          channel?.snippet.thumbnails.default?.url ?? "",
        publishedAt: video.snippet.publishedAt,
        viewCount,
        likeCount: parseInt(video.statistics.likeCount ?? "0"),
        commentCount: parseInt(video.statistics.commentCount ?? "0"),
        subscriberCount,
        duration: video.contentDetails.duration,
        isShorts: isShorts(video.contentDetails.duration, video.snippet.title),
        reaction,
      } satisfies EnrichedVideo;
    })
    .filter((v): v is EnrichedVideo => v !== null);

  return {
    items: enrichedVideos,
    nextPageToken: searchResult.nextPageToken ?? null,
    totalResults: searchResult.pageInfo.totalResults,
  };
}
