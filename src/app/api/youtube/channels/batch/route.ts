/**
 * 경쟁 채널 경량 통계 배치 API Route Handler
 * 여러 채널 ID를 받아 channels.list로 한 번에(1유닛) 통계를 조회한다.
 */

import { NextRequest, NextResponse } from "next/server";
import { getChannelStatsBatch } from "@/lib/youtube-api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelIds } = body;

    if (!Array.isArray(channelIds) || channelIds.length === 0) {
      return NextResponse.json(
        { error: "채널 ID 목록이 필요합니다." },
        { status: 400 }
      );
    }

    // channels.list는 최대 50개까지 한 번에 조회 가능
    const snapshots = await getChannelStatsBatch(channelIds.slice(0, 50));
    return NextResponse.json({ snapshots });
  } catch (error) {
    console.error("채널 배치 통계 API 오류:", error);
    const message =
      error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";

    if (message.includes("quota")) {
      return NextResponse.json(
        { error: "YouTube API 일일 할당량을 초과했습니다." },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
