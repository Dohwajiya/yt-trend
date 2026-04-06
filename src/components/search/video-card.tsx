/**
 * 영상 카드 컴포넌트
 * 모바일에서 사용하는 카드형 영상 정보 표시
 */

"use client";

import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import type { EnrichedVideo } from "@/types/analysis";
import ReactionBadge from "@/components/search/reaction-badge";
import {
  formatNumber,
  formatRelativeDate,
  formatDuration,
} from "@/lib/format";

interface VideoCardProps {
  /** 영상 데이터 */
  video: EnrichedVideo;
  /** 선택 여부 */
  isSelected: boolean;
  /** 선택 토글 콜백 */
  onToggleSelect: (videoId: string) => void;
}

export default function VideoCard({
  video,
  isSelected,
  onToggleSelect,
}: VideoCardProps) {
  return (
    <div className="flex gap-3 rounded-lg border border-border/50 bg-card p-3">
      {/* 체크박스 */}
      <div className="flex items-start pt-1">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(video.videoId)}
        />
      </div>

      {/* 썸네일 */}
      <a
        href={`https://youtube.com/watch?v=${video.videoId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="relative aspect-video w-[140px] shrink-0 overflow-hidden rounded"
      >
        <Image
          src={video.thumbnailUrl}
          alt={video.title}
          fill
          className="object-cover"
          sizes="140px"
        />
        <span className="absolute bottom-0.5 right-0.5 rounded bg-black/80 px-1 py-0.5 text-[10px] text-white">
          {formatDuration(video.duration)}
        </span>
        {video.isShorts && (
          <span className="absolute left-0.5 top-0.5 rounded bg-red-600/90 px-1 py-0.5 text-[10px] font-bold text-white">
            Shorts
          </span>
        )}
      </a>

      {/* 정보 영역 */}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <a
            href={`https://youtube.com/watch?v=${video.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="line-clamp-2 text-sm font-medium hover:text-primary"
          >
            {video.title}
          </a>
          <a
            href={`/channel/${video.channelId}`}
            className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {video.channelThumbnailUrl && (
              <Image
                src={video.channelThumbnailUrl}
                alt={video.channelTitle}
                width={14}
                height={14}
                className="rounded-full"
              />
            )}
            {video.channelTitle}
          </a>
        </div>

        {/* 하단 메타 정보 */}
        <div className="mt-2 flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            조회 {formatNumber(video.viewCount)}
          </span>
          <span className="text-xs text-muted-foreground">
            구독 {video.subscriberCount > 0 ? formatNumber(video.subscriberCount) : "-"}
          </span>
          <ReactionBadge
            grade={video.reaction.grade}
            ratio={video.reaction.ratio}
            subscriberCount={video.subscriberCount}
          />
          <span className="text-[10px] text-muted-foreground">
            {formatRelativeDate(video.publishedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
