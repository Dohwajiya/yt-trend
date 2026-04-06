/**
 * 트렌딩 영상 API Route Handler
 * YouTube mostPopular 차트에서 인기 영상을 가져옴
 */

import { NextRequest, NextResponse } from "next/server";
import { getTrendingVideos } from "@/lib/youtube-api";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const regionCode = searchParams.get("regionCode") ?? "KR";
    const categoryId = searchParams.get("categoryId") ?? "0";
    const maxResults = parseInt(searchParams.get("maxResults") ?? "20");

    const result = await getTrendingVideos(regionCode, categoryId, maxResults);
    return NextResponse.json(result);
  } catch (error) {
    console.error("트렌딩 API 오류:", error);
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
