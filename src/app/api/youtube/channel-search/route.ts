/**
 * 채널 직접 검색 API Route Handler
 * type=channel로 YouTube 채널을 직접 검색
 */

import { NextRequest, NextResponse } from "next/server";
import { searchChannels } from "@/lib/youtube-api";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q");
    if (!q) {
      return NextResponse.json({ error: "키워드를 입력해주세요." }, { status: 400 });
    }

    const channels = await searchChannels(q, 10);
    return NextResponse.json({ channels });
  } catch (error) {
    console.error("채널 검색 API 오류:", error);
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
