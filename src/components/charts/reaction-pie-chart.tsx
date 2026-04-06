/**
 * 반응도 분포 파이차트 컴포넌트
 * Good/Normal/Bad 비율을 시각적으로 표시 (recharts)
 */

"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { ReactionDistribution } from "@/types/analysis";

/** 등급별 색상 */
const COLORS = {
  Good: "#34d399",   // emerald-400
  Normal: "#9ca3af", // gray-400
  Bad: "#f87171",    // red-400
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
            backgroundColor: "hsl(220 15% 10%)",
            border: "1px solid hsl(220 10% 20%)",
            borderRadius: "6px",
            color: "#fff",
            fontSize: "12px",
          }}
          formatter={(value) => [`${value}개`]}
        />
        <Legend
          wrapperStyle={{ fontSize: "12px" }}
          formatter={(value: string) => (
            <span style={{ color: "#ccc" }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
