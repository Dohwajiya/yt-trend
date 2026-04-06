/**
 * 앱 상단 헤더 컴포넌트
 * 사이드바 토글 + 현재 페이지 제목 + 전역 검색을 표시
 */

"use client";

import { usePathname, useRouter } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

/** 경로별 페이지 제목 매핑 */
const pageTitles: Record<string, string> = {
  "/": "대시보드",
  "/search": "영상 찾기",
  "/keywords": "키워드 분석",
  "/trending": "트렌딩",
  "/channel": "채널 분석",
};

interface AppHeaderProps {
  /** 모바일 사이드바 토글 콜백 */
  onMobileMenuToggle: () => void;
}

export default function AppHeader({ onMobileMenuToggle }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [quickSearch, setQuickSearch] = useState("");

  // 현재 페이지 제목 결정
  const title =
    pageTitles[pathname] ??
    (pathname.startsWith("/channel/") ? "채널 상세 분석" : "YT Trend");

  /** 빠른 검색 실행 */
  const handleQuickSearch = () => {
    const trimmed = quickSearch.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    setQuickSearch("");
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border/50 bg-background/80 px-4 backdrop-blur-md">
      {/* 모바일 메뉴 토글 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onMobileMenuToggle}
        className="md:hidden"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* 페이지 제목 */}
      <h1 className="text-lg font-semibold">{title}</h1>

      {/* 빠른 검색 (우측) */}
      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden sm:block">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="빠른 검색..."
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleQuickSearch()}
            className="h-8 w-48 pl-8 text-sm bg-secondary/50 border-border/50"
          />
        </div>
      </div>
    </header>
  );
}
