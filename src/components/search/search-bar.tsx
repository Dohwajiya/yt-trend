/**
 * 검색 바 컴포넌트
 * 키워드 입력 + 검색 버튼으로 구성된 검색 UI
 * 메인 페이지와 영상 찾기 페이지 모두에서 사용
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  /** 초기 키워드 값 */
  initialKeyword?: string;
  /** 검색 바 크기 (메인 페이지에서는 lg 사용) */
  size?: "default" | "lg";
  /** 검색 실행 시 콜백 (영상 찾기 페이지에서 사용) */
  onSearch?: (keyword: string) => void;
}

export default function SearchBar({
  initialKeyword = "",
  size = "default",
  onSearch,
}: SearchBarProps) {
  const [keyword, setKeyword] = useState(initialKeyword);
  const router = useRouter();

  /**
   * 검색 실행 함수
   * onSearch 콜백이 있으면 호출하고, 없으면 검색 페이지로 이동
   */
  const handleSearch = () => {
    const trimmed = keyword.trim();
    if (!trimmed) return;

    if (onSearch) {
      onSearch(trimmed);
    } else {
      // 메인 페이지에서 호출 시 검색 페이지로 이동
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  /** Enter 키로도 검색 가능 */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const isLarge = size === "lg";

  return (
    <div className="flex w-full gap-2">
      <Input
        type="text"
        placeholder="키워드를 입력하세요 (예: 캠핑, 주식 투자)"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={handleKeyDown}
        className={
          isLarge
            ? "h-14 text-lg bg-secondary/50 border-border/50 placeholder:text-muted-foreground/60"
            : "h-10 bg-secondary/50 border-border/50"
        }
      />
      <Button
        onClick={handleSearch}
        disabled={!keyword.trim()}
        className={isLarge ? "h-14 px-8 text-lg" : "h-10 px-6"}
      >
        분석 시작
      </Button>
    </div>
  );
}
