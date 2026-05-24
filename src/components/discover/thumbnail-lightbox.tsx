/**
 * 썸네일 확대 라이트박스
 * 썸네일 갤러리에서 영상을 클릭하면 큰 썸네일과 정보를 오버레이로 보여준다.
 * (base-ui 의존 없이 경량 fixed 오버레이로 구현)
 */

"use client";

import Image from "next/image";
import { X, ExternalLink, MessageCircle } from "lucide-react";
import {
  getOutlierMultiplier,
  getOutlierTier,
  formatMultiplier,
} from "@/lib/outlier";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EnrichedVideo } from "@/types/analysis";

interface ThumbnailLightboxProps {
  /** 확대할 영상 (null이면 닫힘) */
  video: EnrichedVideo | null;
  /** 닫기 콜백 */
  onClose: () => void;
  /** 댓글 보기 콜백 */
  onShowComments?: (video: EnrichedVideo) => void;
}

export default function ThumbnailLightbox({
  video,
  onClose,
  onShowComments,
}: ThumbnailLightboxProps) {
  if (!video) return null;

  const multiplier = getOutlierMultiplier(
    video.viewCount,
    video.subscriberCount
  );
  const tier = getOutlierTier(multiplier);
  const url = `https://youtube.com/watch?v=${video.videoId}`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-xl bg-popover shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-2 top-2 z-10 rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
        >
          <X className="h-5 w-5" />
        </button>

        {/* 큰 썸네일 */}
        <div className="relative aspect-video w-full bg-black">
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            className="object-contain"
            sizes="768px"
          />
          {video.subscriberCount > 0 && (
            <span
              className={cn(
                "absolute left-3 top-3 rounded-md border px-2 py-1 text-sm font-bold",
                tier.colorClass
              )}
            >
              {tier.emoji} {formatMultiplier(multiplier)}
            </span>
          )}
        </div>

        {/* 정보 + 액션 */}
        <div className="space-y-2 p-4">
          <p className="font-semibold">{video.title}</p>
          <p className="text-sm text-muted-foreground">
            {video.channelTitle} · 조회 {formatNumber(video.viewCount)} · 구독{" "}
            {video.subscriberCount > 0
              ? formatNumber(video.subscriberCount)
              : "비공개"}
          </p>
          <div className="flex gap-2 pt-1">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <ExternalLink className="h-4 w-4" /> 유튜브 열기
            </a>
            {onShowComments && (
              <button
                type="button"
                onClick={() => onShowComments(video)}
                className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
              >
                <MessageCircle className="h-4 w-4" /> 댓글
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
