/**
 * 영상 테이블 행 컴포넌트
 * 검색 결과 테이블의 개별 행을 렌더링 (데스크톱용)
 */

"use client";

import Image from "next/image";
import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import type { EnrichedVideo } from "@/types/analysis";
import ReactionBadge from "@/components/search/reaction-badge";
import {
  formatNumber,
  formatRelativeDate,
  formatDuration,
} from "@/lib/format";

interface VideoRowProps {
  /** 영상 데이터 */
  video: EnrichedVideo;
  /** 선택 여부 */
  isSelected: boolean;
  /** 선택 토글 콜백 */
  onToggleSelect: (videoId: string) => void;
}

export default function VideoRow({
  video,
  isSelected,
  onToggleSelect,
}: VideoRowProps) {
  return (
    <TableRow className="hover:bg-secondary/30">
      {/* 체크박스 */}
      <TableCell className="w-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(video.videoId)}
        />
      </TableCell>

      {/* 썸네일 */}
      <TableCell className="w-[130px] p-2">
        <a
          href={`https://youtube.com/watch?v=${video.videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="relative block aspect-video w-[110px] overflow-hidden rounded"
        >
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            className="object-cover"
            sizes="110px"
          />
          {/* 영상 길이 배지 */}
          <span className="absolute bottom-0.5 right-0.5 rounded bg-black/80 px-1 py-0.5 text-[10px] text-white">
            {formatDuration(video.duration)}
          </span>
          {/* 쇼츠 표시 */}
          {video.isShorts && (
            <span className="absolute left-0.5 top-0.5 rounded bg-red-600/90 px-1 py-0.5 text-[10px] font-bold text-white">
              Shorts
            </span>
          )}
        </a>
      </TableCell>

      {/* 제목 + 채널명 */}
      <TableCell className="min-w-[200px]">
        <div className="flex flex-col gap-1">
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
            {video.channelTitle}
          </a>
        </div>
      </TableCell>

      {/* 조회수 */}
      <TableCell className="w-[90px] text-right text-sm">
        {formatNumber(video.viewCount)}
      </TableCell>

      {/* 구독자 수 */}
      <TableCell className="w-[90px] text-right text-sm">
        {video.subscriberCount > 0
          ? formatNumber(video.subscriberCount)
          : "-"}
      </TableCell>

      {/* 반응도 */}
      <TableCell className="w-[80px] text-center">
        <ReactionBadge
          grade={video.reaction.grade}
          ratio={video.reaction.ratio}
          subscriberCount={video.subscriberCount}
        />
      </TableCell>

      {/* 게시일 */}
      <TableCell className="w-[90px] text-right text-xs text-muted-foreground">
        {formatRelativeDate(video.publishedAt)}
      </TableCell>
    </TableRow>
  );
}
