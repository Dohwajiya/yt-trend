/**
 * 앱 레이아웃 래퍼 컴포넌트
 * 사이드바 + 헤더 + 메인 콘텐츠 구조를 관리
 * 모바일에서는 Sheet를 사용한 오버레이 사이드바
 */

"use client";

import { useState } from "react";
import AppSidebar from "@/components/layout/app-sidebar";
import AppHeader from "@/components/layout/app-header";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  // 데스크톱 사이드바 축소 상태
  const [collapsed, setCollapsed] = useState(false);
  // 모바일 사이드바 열림 상태
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* 데스크톱 사이드바 (md 이상에서만 보임) */}
      <div className="hidden md:block">
        <AppSidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
      </div>

      {/* 모바일 사이드바 (Sheet 오버레이) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-56 p-0">
          <AppSidebar
            collapsed={false}
            onToggleCollapse={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* 메인 콘텐츠 영역 */}
      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-200",
          collapsed ? "md:ml-16" : "md:ml-56"
        )}
      >
        <AppHeader onMobileMenuToggle={() => setMobileOpen(true)} />
        <main className="flex-1">{children}</main>
      </div>
    </>
  );
}
