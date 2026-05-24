/**
 * 영상 인기 댓글 API Route Handler
 * 떡상 영상의 시청자 반응을 콘텐츠 아이디어로 활용하기 위해 인기 댓글을 조회한다.
 */

import { NextRequest, NextResponse } from "next/server";
import { getVideoComments } from "@/lib/youtube-api";

export async function GET(request: NextRequest) {
  try {
    const videoId = request.nextUrl.searchParams.get("videoId");
    if (!videoId) {
      return NextResponse.json(
        { error: "videoId가 필요합니다." },
        { status: 400 }
      );
    }

    const comments = await getVideoComments(videoId);
    return NextResponse.json({ comments, disabled: false });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";

    // 댓글이 비활성화된 영상은 정상 응답으로 처리 (빈 목록 + disabled 플래그)
    if (message.includes("disabled")) {
      return NextResponse.json({ comments: [], disabled: true });
    }

    console.error("댓글 API 오류:", error);

    if (message.includes("quota")) {
      return NextResponse.json(
        { error: "YouTube API 일일 할당량을 초과했습니다." },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
