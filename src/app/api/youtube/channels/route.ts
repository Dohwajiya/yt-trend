/**
 * YouTube 채널 영상 조회 API Route Handler
 * 채널 통계 + 최근 영상 목록 + 건강도/수익 분석 반환
 */

import { NextRequest, NextResponse } from "next/server";
import { getChannelVideosWithStats } from "@/lib/youtube-api";
import {
  calculateChannelHealth,
  estimateRevenue,
  estimateMonthlyViews,
} from "@/lib/channel-analysis";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelId, maxResults = 30 } = body;

    if (!channelId || typeof channelId !== "string") {
      return NextResponse.json(
        { error: "채널 ID를 입력해주세요." },
        { status: 400 }
      );
    }

    const result = await getChannelVideosWithStats(channelId, maxResults);

    // 건강도 + 수익 계산
    const health = calculateChannelHealth(
      result.items,
      result.channelStats?.totalViewCount ?? 0,
      result.channelStats?.subscriberCount ?? 0
    );
    const monthlyViews = estimateMonthlyViews(result.items);
    const revenue = estimateRevenue(monthlyViews);

    return NextResponse.json({
      ...result,
      health,
      revenue,
      monthlyViews,
    });
  } catch (error) {
    console.error("YouTube 채널 API 오류:", error);
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
