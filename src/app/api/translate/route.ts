/**
 * 키워드 번역 API Route Handler
 * 한글 키워드를 검색 대상 국가 언어(영어/일본어)로 번역한다.
 * Google 무료 번역 엔드포인트를 서버에서 호출해 CORS를 우회한다(키 불필요).
 * 실패 시 원문을 그대로 돌려줘 검색이 막히지 않게 한다.
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const target = request.nextUrl.searchParams.get("target") ?? "en";

  if (!q.trim()) {
    return NextResponse.json({ error: "q가 필요합니다." }, { status: 400 });
  }

  try {
    const url =
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto` +
      `&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(q)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("번역 요청 실패");

    // 응답 형태: [[[번역문, 원문, ...], ...], null, "ko", ...]
    const data: unknown = await res.json();
    let translated = q;
    if (Array.isArray(data) && Array.isArray(data[0])) {
      translated = (data[0] as unknown[])
        .map((seg) => (Array.isArray(seg) ? String(seg[0] ?? "") : ""))
        .join("")
        .trim();
    }

    return NextResponse.json({ translated: translated || q });
  } catch (error) {
    console.error("번역 API 오류:", error);
    // 번역 실패 시 원문 유지 (검색은 계속 가능)
    return NextResponse.json({ translated: q });
  }
}
