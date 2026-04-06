/**
 * CSV 내보내기 유틸리티
 * 수집한 영상 데이터를 CSV 파일로 다운로드하는 기능
 */

import type { EnrichedVideo } from "@/types/analysis";

/**
 * 영상 목록을 CSV 파일로 변환하여 다운로드하는 함수
 * UTF-8 BOM을 추가하여 Excel에서 한글이 깨지지 않도록 처리
 *
 * @param videos - 내보낼 영상 목록
 * @param filename - 파일명 (기본값: yt-trend-YYYY-MM-DD.csv)
 */
export function exportToCsv(
  videos: EnrichedVideo[],
  filename?: string
): void {
  // CSV 헤더 (한국어)
  const headers = [
    "제목",
    "채널명",
    "조회수",
    "구독자수",
    "반응도",
    "반응도비율",
    "좋아요",
    "댓글수",
    "게시일",
    "쇼츠여부",
    "URL",
  ];

  // 각 영상 데이터를 행으로 변환
  const rows = videos.map((v) => [
    v.title,
    v.channelTitle,
    v.viewCount,
    v.subscriberCount,
    v.reaction.grade,
    (v.reaction.ratio * 100).toFixed(1) + "%",
    v.likeCount,
    v.commentCount,
    v.publishedAt,
    v.isShorts ? "Y" : "N",
    `https://youtube.com/watch?v=${v.videoId}`,
  ]);

  // BOM(Byte Order Mark) + CSV 문자열 생성
  // BOM은 Excel에서 UTF-8을 올바르게 인식하기 위해 필요
  const bom = "\uFEFF";
  const csvContent =
    bom +
    [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

  // Blob을 생성하고 다운로드 링크를 트리거
  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download =
    filename ?? `yt-trend-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();

  // 메모리 해제
  URL.revokeObjectURL(url);
}
