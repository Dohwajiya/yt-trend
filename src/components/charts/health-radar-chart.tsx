/**
 * 채널 건강도 레이더차트 컴포넌트
 * 4개 항목(반응도, 업로드빈도, 조회/구독비율, 참여도)을 시각적으로 비교
 */

"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { HealthBreakdown } from "@/types/analysis";

interface HealthRadarChartProps {
  /** 채널 A 건강도 세부 항목 */
  dataA: HealthBreakdown;
  /** 채널 A 이름 */
  labelA: string;
  /** 채널 B 건강도 세부 항목 (비교 모드) */
  dataB?: HealthBreakdown;
  /** 채널 B 이름 */
  labelB?: string;
  height?: number;
}

export default function HealthRadarChart({
  dataA,
  labelA,
  dataB,
  labelB,
  height = 250,
}: HealthRadarChartProps) {
  const chartData = [
    {
      subject: "반응도",
      A: dataA.reactionScore,
      B: dataB?.reactionScore ?? 0,
    },
    {
      subject: "업로드 빈도",
      A: dataA.uploadFrequencyScore,
      B: dataB?.uploadFrequencyScore ?? 0,
    },
    {
      subject: "조회/구독",
      A: dataA.viewSubscriberRatioScore,
      B: dataB?.viewSubscriberRatioScore ?? 0,
    },
    {
      subject: "참여도",
      A: dataA.engagementScore,
      B: dataB?.engagementScore ?? 0,
    },
  ];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={chartData}>
        <PolarGrid stroke="#374151" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: "#9ca3af", fontSize: 11 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fill: "#6b7280", fontSize: 10 }}
        />
        <Radar
          name={labelA}
          dataKey="A"
          stroke="#34d399"
          fill="#34d399"
          fillOpacity={0.2}
        />
        {dataB && (
          <Radar
            name={labelB ?? "B"}
            dataKey="B"
            stroke="#60a5fa"
            fill="#60a5fa"
            fillOpacity={0.2}
          />
        )}
        <Legend wrapperStyle={{ fontSize: "12px" }} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
