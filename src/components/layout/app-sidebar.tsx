/**
 * 앱 사이드바 컴포넌트
 * SaaS 스타일 좌측 고정 네비게이션으로 모든 페이지 메뉴를 제공
 * 모바일에서는 Sheet 오버레이로 동작
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  TrendingUp,
  Flame,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** 메뉴 항목 정의 */
const menuGroups = [
  {
    label: "분석",
    items: [
      { href: "/", icon: LayoutDashboard, label: "대시보드" },
      { href: "/search", icon: Search, label: "영상 찾기" },
      { href: "/keywords", icon: TrendingUp, label: "키워드 분석" },
      { href: "/trending", icon: Flame, label: "트렌딩" },
    ],
  },
  {
    label: "채널",
    items: [
      { href: "/channel", icon: Users, label: "채널 분석" },
    ],
  },
];

interface AppSidebarProps {
  /** 사이드바 축소 상태 */
  collapsed: boolean;
  /** 축소 상태 토글 콜백 */
  onToggleCollapse: () => void;
}

export default function AppSidebar({
  collapsed,
  onToggleCollapse,
}: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-full flex-col border-r border-border/50 bg-card transition-all duration-200",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* 로고 */}
      <div className="flex h-14 items-center border-b border-border/50 px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">YT</span>
          {!collapsed && (
            <span className="text-lg font-semibold text-foreground">
              Trend
            </span>
          )}
        </Link>
      </div>

      {/* 메뉴 */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {menuGroups.map((group) => (
          <div key={group.label} className="mb-4">
            {/* 그룹 라벨 */}
            {!collapsed && (
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
            )}

            {/* 메뉴 아이템 */}
            {group.items.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "mb-0.5 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    collapsed && "justify-center px-0"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* 하단: 축소 토글 버튼 */}
      <div className="border-t border-border/50 p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="w-full justify-center"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </aside>
  );
}
