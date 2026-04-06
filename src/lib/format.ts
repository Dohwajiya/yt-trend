/**
 * 숫자/날짜 포맷 유틸리티
 * 조회수, 구독자 수 등의 숫자를 사용자 친화적으로 표시
 */

/**
 * 큰 숫자를 한국식 약어로 변환하는 함수
 * 예: 1234 → "1,234", 12345 → "1.2만", 1234567 → "123.4만", 12345678 → "1,234.5만"
 *
 * @param num - 변환할 숫자
 * @returns 포맷된 문자열
 */
export function formatNumber(num: number): string {
  if (num >= 100_000_000) {
    // 1억 이상
    return `${(num / 100_000_000).toFixed(1)}억`;
  }
  if (num >= 10_000) {
    // 1만 이상
    return `${(num / 10_000).toFixed(1)}만`;
  }
  // 1만 미만은 쉼표 포맷
  return num.toLocaleString("ko-KR");
}

/**
 * ISO 8601 날짜 문자열을 상대적 시간으로 변환하는 함수
 * 예: "2024-01-15T10:30:00Z" → "3개월 전"
 *
 * @param dateString - ISO 8601 형식 날짜 문자열
 * @returns 상대적 시간 문자열
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffYears > 0) return `${diffYears}년 전`;
  if (diffMonths > 0) return `${diffMonths}개월 전`;
  if (diffDays > 0) return `${diffDays}일 전`;
  if (diffHours > 0) return `${diffHours}시간 전`;
  if (diffMinutes > 0) return `${diffMinutes}분 전`;
  return "방금 전";
}

/**
 * ISO 8601 영상 길이를 사람이 읽을 수 있는 형태로 변환하는 함수
 * 예: "PT4M13S" → "4:13", "PT1H2M3S" → "1:02:03"
 *
 * @param duration - ISO 8601 형식 영상 길이 (예: "PT4M13S")
 * @returns 포맷된 시간 문자열
 */
export function formatDuration(duration: string): string {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "0:00";

  const hours = parseInt(match[1] ?? "0");
  const minutes = parseInt(match[2] ?? "0");
  const seconds = parseInt(match[3] ?? "0");

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * ISO 8601 영상 길이를 초 단위로 변환하는 함수
 * 쇼츠 판별에 사용 (60초 이하면 쇼츠)
 *
 * @param duration - ISO 8601 형식 영상 길이
 * @returns 총 초 수
 */
export function parseDurationToSeconds(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] ?? "0");
  const minutes = parseInt(match[2] ?? "0");
  const seconds = parseInt(match[3] ?? "0");

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * 쇼츠 여부를 판별하는 함수
 * 영상 길이가 60초 이하이거나 제목에 #shorts가 포함되면 쇼츠로 판정
 *
 * @param duration - ISO 8601 형식 영상 길이
 * @param title - 영상 제목 (보조 판별용)
 * @returns 쇼츠 여부
 */
export function isShorts(duration: string, title: string = ""): boolean {
  const seconds = parseDurationToSeconds(duration);
  const hasShortTag = title.toLowerCase().includes("#shorts");
  return seconds <= 60 || hasShortTag;
}

/**
 * 반응도 비율을 퍼센트 문자열로 변환하는 함수
 * 예: 0.3456 → "34.6%"
 *
 * @param ratio - 반응도 비율
 * @returns 퍼센트 문자열
 */
export function formatRatio(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}
