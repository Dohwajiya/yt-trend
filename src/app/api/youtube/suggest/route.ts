/**
 * YouTube 키워드 추천 API Route Handler
 * Google Suggest API를 서버에서 호출하여 CORS 우회
 * Quota 소비: 0 (무료)
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q");

    if (!q || typeof q !== "string") {
      return NextResponse.json(
        { error: "키워드를 입력해주세요." },
        { status: 400 }
      );
    }

    // client=firefox → 순수 JSON, hl=ko → 한국어 결과
    const response = await fetch(
      `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(q)}&hl=ko`,
      {
        headers: {
          "Accept-Charset": "utf-8",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Suggest API 호출 실패");
    }

    // 응답을 텍스트로 먼저 받아서 UTF-8로 올바르게 파싱
    const rawText = await response.text();
    const data = JSON.parse(rawText);
    const suggestions: string[] = Array.isArray(data[1]) ? data[1] : [];

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Suggest API 오류:", error);
    return NextResponse.json({ suggestions: [] });
  }
}
