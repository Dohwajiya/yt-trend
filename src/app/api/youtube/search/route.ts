/**
 * YouTube 영상 검색 API Route Handler
 * 클라이언트의 검색 요청을 받아 3단계 파이프라인을 실행하고
 * 분석된 영상 목록을 반환하는 서버 엔드포인트
 */

import { NextRequest, NextResponse } from "next/server";
import { searchAndAnalyze } from "@/lib/youtube-api";

/**
 * POST /api/youtube/search
 * 키워드 기반 영상 검색 + 반응도 분석
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      keyword,
      regionCode = "KR",
      pageToken,
      maxResults = 25,
    } = body;

    // 키워드 필수 검증
    if (!keyword || typeof keyword !== "string") {
      return NextResponse.json(
        { error: "검색 키워드를 입력해주세요." },
        { status: 400 }
      );
    }

    // 3단계 파이프라인 실행 (search → videos → channels → 반응도 계산)
    const result = await searchAndAnalyze(
      keyword.trim(),
      regionCode,
      maxResults,
      pageToken
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("YouTube 검색 API 오류:", error);

    const message =
      error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";

    // API 할당량 초과 에러 감지
    if (message.includes("quota")) {
      return NextResponse.json(
        { error: "YouTube API 일일 할당량을 초과했습니다. 내일 다시 시도해주세요." },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
