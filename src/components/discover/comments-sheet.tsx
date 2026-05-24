/**
 * 댓글 인사이트 시트
 * 떡상 영상의 인기 댓글을 우측 패널로 보여준다.
 * 시청자 반응·니즈에서 다음 콘텐츠 아이디어를 얻기 위함이다.
 */

"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ThumbsUp } from "lucide-react";
import { formatNumber, formatRelativeDate } from "@/lib/format";
import type { CommentItem, EnrichedVideo } from "@/types/analysis";

interface CommentsSheetProps {
  /** 댓글을 볼 영상 (null이면 미선택) */
  video: EnrichedVideo | null;
  /** 시트 열림 상태 */
  open: boolean;
  /** 열림 상태 변경 콜백 */
  onOpenChange: (open: boolean) => void;
}

export default function CommentsSheet({
  video,
  open,
  onOpenChange,
}: CommentsSheetProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 시트가 열리고 영상이 지정되면 댓글 조회
  useEffect(() => {
    if (!open || !video) return;
    const videoId = video.videoId;
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      setDisabled(false);
      setComments([]);
      try {
        const res = await fetch(`/api/youtube/comments?videoId=${videoId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "댓글을 불러올 수 없습니다.");
        if (cancelled) return;
        setComments(data.comments ?? []);
        setDisabled(!!data.disabled);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [open, video]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="line-clamp-2 pr-8 text-sm">
            {video?.title ?? "댓글"}
          </SheetTitle>
          <SheetDescription>
            인기 댓글 — 시청자 반응에서 콘텐츠 아이디어를 얻으세요.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              댓글 불러오는 중...
            </p>
          )}

          {!loading && error && (
            <p className="py-10 text-center text-sm text-destructive">{error}</p>
          )}

          {!loading && disabled && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              이 영상은 댓글이 비활성화되어 있어요.
            </p>
          )}

          {!loading && !error && !disabled && comments.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              댓글이 없습니다.
            </p>
          )}

          {!loading && comments.length > 0 && (
            <ul className="space-y-3">
              {comments.map((c) => (
                <li
                  key={c.id}
                  className="border-b border-border/40 pb-3 last:border-0"
                >
                  <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {c.author}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <ThumbsUp className="h-3 w-3" />
                      {formatNumber(c.likeCount)}
                    </span>
                    <span>· {formatRelativeDate(c.publishedAt)}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{c.text}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
