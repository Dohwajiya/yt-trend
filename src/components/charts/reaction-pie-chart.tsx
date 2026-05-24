/**
 * 반응도 분포 파이차트 컴포넌트
 * Good/Normal/Bad 비율을 시각적으로 표시 (recharts)
 */

"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { ReactionDistribution } from "@/types/analysis";

/** 등급별 색상 (라이트 배경 대비 고려) */
const COLORS = {
  Good: "#10b981",   // emerald-500
  Normal: "#94a3b8", // slate-400
  Bad: "#ef4444",    // red-500
};

interface ReactionPieChartProps {
  /** 반응도 분포 데이터 */
  distribution: ReactionDistribution;
  /** 차트 높이 (기본: 200) */
  height?: number;
}

export default function ReactionPieChart({
  distribution,
  height = 200,
}: ReactionPieChartProps) {
  const data = [
    { name: "Good", value: distribution.good },
    { name: "Normal", value: distribution.normal },
    { name: "Bad", value: distribution.bad },
  ].filter((d) => d.value > 0);

  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={70}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry) => (
            <Cell
              key={entry.name}
              fill={COLORS[entry.name as keyof typeof COLORS]}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            color: "#111827",
            fontSize: "12px",
          }}
          formatter={(value) => [`${value}개`]}
        />
        <Legend
          wrapperStyle={{ fontSize: "12px" }}
          formatter={(value: string) => (
            <span style={{ color: "#374151" }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
