/**
 * YouTube 키워드 추천 API Route Handler
 * Google Suggest API를 서버에서 호출하여 CORS 우회
 * Quota 소비: 0 (무료)
 * 주의: Google Suggest API는 한국어를 EUC-KR로 반환하므로 디코딩 필요
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

    const response = await fetch(
      `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(q)}&hl=ko`
    );

    if (!response.ok) {
      throw new Error("Suggest API 호출 실패");
    }

    // Google Suggest API는 한국어를 EUC-KR 인코딩으로 반환
    // ArrayBuffer로 받아서 TextDecoder로 EUC-KR → UTF-8 변환
    const buffer = await response.arrayBuffer();
    const decoded = new TextDecoder("euc-kr").decode(buffer);
    const data = JSON.parse(decoded);
    const suggestions: string[] = Array.isArray(data[1]) ? data[1] : [];

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Suggest API 오류:", error);
    return NextResponse.json({ suggestions: [] });
  }
}
