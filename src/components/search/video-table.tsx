/**
 * 영상 결과 테이블 컴포넌트
 * 데스크톱에서는 테이블, 모바일에서는 카드 리스트로 표시
 * 스켈레톤 로딩 UI 포함
 */

"use client";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import type { EnrichedVideo } from "@/types/analysis";
import VideoRow from "@/components/search/video-row";
import VideoCard from "@/components/search/video-card";

interface VideoTableProps {
  /** 영상 목록 */
  videos: EnrichedVideo[];
  /** 로딩 중 여부 */
  isLoading: boolean;
  /** 선택된 영상 ID 목록 */
  selectedVideoIds: Set<string>;
  /** 개별 영상 선택 토글 */
  onToggleSelect: (videoId: string) => void;
  /** 전체 선택 토글 */
  onToggleSelectAll: () => void;
}

export default function VideoTable({
  videos,
  isLoading,
  selectedVideoIds,
  onToggleSelect,
  onToggleSelectAll,
}: VideoTableProps) {
  // 전체 선택 여부 판정
  const allSelected =
    videos.length > 0 && videos.every((v) => selectedVideoIds.has(v.videoId));

  // 로딩 중일 때 스켈레톤 표시
  if (isLoading && videos.length === 0) {
    return <LoadingSkeleton />;
  }

  // 결과 없음
  if (!isLoading && videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-lg">검색 결과가 없어요</p>
        <p className="mt-1 text-sm">다른 키워드로 검색해보세요.</p>
      </div>
    );
  }

  return (
    <>
      {/* 데스크톱: 테이블 뷰 */}
      <div className="hidden overflow-x-auto md:block">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={onToggleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[130px]">썸네일</TableHead>
              <TableHead>제목 / 채널</TableHead>
              <TableHead className="w-[90px] text-right">조회수</TableHead>
              <TableHead className="w-[90px] text-right">구독자</TableHead>
              <TableHead className="w-[80px] text-center">반응도</TableHead>
              <TableHead className="w-[90px] text-right">게시일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {videos.map((video) => (
              <VideoRow
                key={video.videoId}
                video={video}
                isSelected={selectedVideoIds.has(video.videoId)}
                onToggleSelect={onToggleSelect}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 모바일: 카드 리스트 뷰 */}
      <div className="flex flex-col gap-3 md:hidden">
        {videos.map((video) => (
          <VideoCard
            key={video.videoId}
            video={video}
            isSelected={selectedVideoIds.has(video.videoId)}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </div>

      {/* 추가 로딩 중 표시 */}
      {isLoading && videos.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </>
  );
}

/** 로딩 스켈레톤 컴포넌트 */
function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border border-border/50 p-3">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="aspect-video w-[110px] rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}
