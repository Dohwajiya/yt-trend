/**
 * 아웃라이어(떡상) 영상 카드 컴포넌트
 * 콘텐츠 영감 발굴 페이지에서 썸네일을 강조한 그리드 카드로 표시한다.
 * 구독자 대비 조회수 배수를 큼직하게 노출해 "떡상" 영상을 한눈에 보여준다.
 */

"use client";

import Image from "next/image";
import { Bookmark, BookmarkCheck, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useReferenceStore } from "@/stores/reference-store";
import type { EnrichedVideo } from "@/types/analysis";
import {
  getOutlierMultiplier,
  getOutlierTier,
  formatMultiplier,
} from "@/lib/outlier";
import {
  formatNumber,
  formatRelativeDate,
  formatDuration,
} from "@/lib/format";
import { cn } from "@/lib/utils";

interface OutlierCardProps {
  /** 영상 데이터 */
  video: EnrichedVideo;
  /** 정렬 순위 (1부터) */
  rank: number;
  /** 내 채널 기준 구독자 수 (제공 시 '우리 대비 Nx' 배지 표시) */
  anchorSubs?: number;
  /** 댓글 보기 콜백 (제공 시 댓글 버튼 표시) */
  onShowComments?: (video: EnrichedVideo) => void;
}

export default function OutlierCard({
  video,
  rank,
  anchorSubs,
  onShowComments,
}: OutlierCardProps) {
  // 구독자 대비 조회수 배수와 등급 계산
  const multiplier = getOutlierMultiplier(
    video.viewCount,
    video.subscriberCount
  );
  const tier = getOutlierTier(multiplier);
  const hasSubscriber = video.subscriberCount > 0;
  const videoUrl = `https://youtube.com/watch?v=${video.videoId}`;

  // 레퍼런스(스와이프 파일) 저장 상태
  const { videos: savedRefs, addReference, removeReference } =
    useReferenceStore();
  const saved = savedRefs.some((v) => v.videoId === video.videoId);

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-border/50 bg-card transition-colors hover:border-primary/30">
      {/* 썸네일 + 오버레이 배지 */}
      <a
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block aspect-video w-full overflow-hidden"
      >
        <Image
          src={video.thumbnailUrl}
          alt={video.title}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* 배수 배지 (구독자 공개 시) */}
        {hasSubscriber && (
          <span
            className={cn(
              "absolute left-2 top-2 rounded-md border px-2 py-1 text-sm font-bold backdrop-blur-sm",
              tier.colorClass
            )}
          >
            {tier.emoji} {formatMultiplier(multiplier)}
          </span>
        )}

        {/* 순위 */}
        <span className="absolute right-2 top-2 rounded bg-black/70 px-2 py-0.5 text-xs font-bold text-white">
          #{rank}
        </span>

        {/* 영상 길이 */}
        <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[10px] text-white">
          {formatDuration(video.duration)}
        </span>

        {/* 쇼츠 표시 */}
        {video.isShorts && (
          <span className="absolute bottom-1 left-1 rounded bg-red-600/90 px-1 py-0.5 text-[10px] font-bold text-white">
            Shorts
          </span>
        )}
      </a>

      {/* 정보 영역 */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="line-clamp-2 text-sm font-medium hover:text-primary"
        >
          {video.title}
        </a>

        <a
          href={`/channel/${video.channelId}`}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          {video.channelThumbnailUrl && (
            <Image
              src={video.channelThumbnailUrl}
              alt={video.channelTitle}
              width={16}
              height={16}
              className="rounded-full"
            />
          )}
          <span className="truncate">{video.channelTitle}</span>
        </a>

        {/* 하단 메타 */}
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-muted-foreground">
          <span>조회 {formatNumber(video.viewCount)}</span>
          <span>
            구독 {hasSubscriber ? formatNumber(video.subscriberCount) : "비공개"}
          </span>
          <span>{formatRelativeDate(video.publishedAt)}</span>
        </div>

        {/* 등급 배지 + 액션 */}
        <div className="flex items-center gap-1.5 pt-1.5">
          <Badge
            variant="outline"
            className={cn("text-[10px]", tier.colorClass)}
          >
            {tier.level}
          </Badge>
          {anchorSubs && anchorSubs > 0 && (
            <Badge
              variant="outline"
              className="border-primary/40 text-[10px] text-primary"
              title="내 채널 구독자 수 대비 조회 배수"
            >
              우리 대비 {formatMultiplier(video.viewCount / anchorSubs)}
            </Badge>
          )}
          <div className="ml-auto flex items-center gap-2">
            {onShowComments && (
              <button
                type="button"
                onClick={() => onShowComments(video)}
                aria-label="댓글 보기"
                className="inline-flex items-center text-muted-foreground/60 transition-colors hover:text-foreground"
              >
                <MessageCircle className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                saved ? removeReference(video.videoId) : addReference(video)
              }
              aria-label={saved ? "레퍼런스에서 제거" : "레퍼런스로 저장"}
              className={cn(
                "inline-flex items-center transition-colors",
                saved
                  ? "text-primary"
                  : "text-muted-foreground/60 hover:text-foreground"
              )}
            >
              {saved ? (
                <BookmarkCheck className="h-4 w-4" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
