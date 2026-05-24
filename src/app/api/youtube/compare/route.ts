/**
 * 2채널 헤드투헤드 비교 API Route Handler
 * 두 채널의 통계 + 건강도 + 예상 수익을 함께 계산해 CompareApiResponse로 반환한다.
 */

import { NextRequest, NextResponse } from "next/server";
import { getChannelVideosWithStats } from "@/lib/youtube-api";
import {
  calculateChannelHealth,
  estimateRevenue,
  estimateMonthlyViews,
} from "@/lib/channel-analysis";
import type {
  CompareChannelData,
  ChannelDetailStats,
} from "@/types/analysis";

/** 단일 채널의 비교용 데이터(통계·영상·건강도·수익)를 구성 */
async function buildChannelData(
  channelId: string
): Promise<CompareChannelData> {
  const result = await getChannelVideosWithStats(channelId, 30);

  // 채널 통계가 없으면 기본값으로 대체
  const stats: ChannelDetailStats = result.channelStats ?? {
    subscriberCount: 0,
    totalViewCount: 0,
    totalVideoCount: 0,
    channelTitle: "",
    channelThumbnailUrl: "",
    description: "",
  };

  const health = calculateChannelHealth(
    result.items,
    stats.totalViewCount,
    stats.subscriberCount
  );
  const monthlyViews = estimateMonthlyViews(result.items);
  const revenue = estimateRevenue(monthlyViews);

  return { stats, videos: result.items, health, revenue };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const a = searchParams.get("a");
    const b = searchParams.get("b");

    if (!a || !b) {
      return NextResponse.json(
        { error: "비교할 두 채널 ID(a, b)가 필요합니다." },
        { status: 400 }
      );
    }

    // 두 채널을 병렬로 조회
    const [channelA, channelB] = await Promise.all([
      buildChannelData(a),
      buildChannelData(b),
    ]);

    return NextResponse.json({ channelA, channelB });
  } catch (error) {
    console.error("채널 비교 API 오류:", error);
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
