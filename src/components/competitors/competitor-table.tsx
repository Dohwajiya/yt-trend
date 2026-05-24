/**
 * 경쟁 채널 비교 테이블 컴포넌트
 * 워치리스트 채널들의 경량 통계를 정렬 가능한 표로 보여준다.
 * 채널 클릭 시 상세 분석 페이지로 이동, 체크박스로 비교 대상 2개 선택 가능.
 */

"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Trash2 } from "lucide-react";
import ReactionBadge from "@/components/search/reaction-badge";
import MetricInfo from "@/components/ui/metric-info";
import { calculateReaction } from "@/lib/reaction";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CompetitorSnapshot } from "@/types/analysis";

/** 정렬 가능한 숫자 컬럼 키 */
type SortKey =
  | "subscriberCount"
  | "totalViewCount"
  | "totalVideoCount"
  | "avgViewsPerVideo"
  | "avgReactionRatio";

interface CompetitorTableProps {
  /** 채널 통계 스냅샷 목록 */
  snapshots: CompetitorSnapshot[];
  /** 비교 대상으로 선택된 채널 ID */
  selectedIds: Set<string>;
  /** 선택 토글 콜백 */
  onToggleSelect: (channelId: string) => void;
  /** 비교 선택 한도(2개) 도달 여부 */
  selectionFull: boolean;
  /** 워치리스트에서 제거 콜백 */
  onRemove: (channelId: string) => void;
}

/** 정렬 가능한 헤더 셀 */
function SortHeader({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: "asc" | "desc";
  onSort: (key: SortKey) => void;
}) {
  const active = sortKey === activeKey;
  return (
    <button
      onClick={() => onSort(sortKey)}
      className={cn(
        "ml-auto flex items-center gap-1 hover:text-foreground",
        active ? "text-primary" : "text-muted-foreground"
      )}
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
      {active && <span className="text-[10px]">{dir === "desc" ? "▼" : "▲"}</span>}
    </button>
  );
}

export default function CompetitorTable({
  snapshots,
  selectedIds,
  onToggleSelect,
  selectionFull,
  onRemove,
}: CompetitorTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("subscriberCount");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sorted = useMemo(() => {
    return [...snapshots].sort((a, b) => {
      const diff = a[sortKey] - b[sortKey];
      return sortDir === "desc" ? -diff : diff;
    });
  }, [snapshots, sortKey, sortDir]);

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[820px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10" />
            <TableHead className="w-10 text-center">#</TableHead>
            <TableHead>채널</TableHead>
            <TableHead className="w-[110px] text-right">
              <SortHeader label="구독자" sortKey="subscriberCount" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
            </TableHead>
            <TableHead className="w-[110px] text-right">
              <SortHeader label="총 조회수" sortKey="totalViewCount" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
            </TableHead>
            <TableHead className="w-[90px] text-right">
              <SortHeader label="영상 수" sortKey="totalVideoCount" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
            </TableHead>
            <TableHead className="w-[110px] text-right">
              <div className="flex items-center justify-end gap-1">
                <SortHeader label="영상당 평균" sortKey="avgViewsPerVideo" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                <MetricInfo metric="avgViewsPerVideo" />
              </div>
            </TableHead>
            <TableHead className="w-[100px] text-center">
              <div className="flex items-center justify-center gap-1">
                <SortHeader label="평균 반응도" sortKey="avgReactionRatio" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                <MetricInfo metric="avgReaction" />
              </div>
            </TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((ch, index) => {
            const reaction = calculateReaction(
              ch.avgViewsPerVideo,
              ch.subscriberCount
            );
            const selected = selectedIds.has(ch.channelId);
            // 선택 한도에 걸렸고 본인이 선택되지 않은 경우 체크 비활성화
            const disabled = selectionFull && !selected;

            return (
              <TableRow key={ch.channelId} className="hover:bg-secondary/30">
                <TableCell className="w-10">
                  <Checkbox
                    checked={selected}
                    disabled={disabled}
                    onCheckedChange={() => onToggleSelect(ch.channelId)}
                  />
                </TableCell>
                <TableCell className="text-center text-sm font-bold text-primary">
                  {index + 1}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/channel/${ch.channelId}`}
                    className="flex items-center gap-3 hover:text-primary"
                  >
                    {ch.channelThumbnailUrl && (
                      <Image
                        src={ch.channelThumbnailUrl}
                        alt={ch.channelTitle}
                        width={36}
                        height={36}
                        className="rounded-full"
                      />
                    )}
                    <span className="font-medium">{ch.channelTitle}</span>
                  </Link>
                </TableCell>
                <TableCell className="text-right text-sm">
                  {ch.subscriberCount > 0 ? formatNumber(ch.subscriberCount) : "비공개"}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {formatNumber(ch.totalViewCount)}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {formatNumber(ch.totalVideoCount)}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {formatNumber(ch.avgViewsPerVideo)}
                </TableCell>
                <TableCell className="text-center">
                  <ReactionBadge
                    grade={reaction.grade}
                    ratio={reaction.ratio}
                    subscriberCount={ch.subscriberCount}
                  />
                </TableCell>
                <TableCell className="w-10">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(ch.channelId)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    title="워치리스트에서 제거"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
