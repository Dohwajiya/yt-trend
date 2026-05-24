/**
 * 키워드 기회 매트릭스 산점도 컴포넌트
 * x축=경쟁도, y축=평균 반응도(%)로 키워드를 배치한다.
 * 좌상단(저경쟁·고반응)일수록 노릴 만한 키워드다 (recharts).
 */

"use client";

import {
  ScatterChart,
  Scatter,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import type { KeywordComparison } from "@/types/analysis";

interface KeywordOpportunityChartProps {
  /** 키워드 비교 결과 목록 */
  data: KeywordComparison[];
  /** 차트 높이 (기본: 300) */
  height?: number;
}

/** 산점도 점 데이터 */
interface PointDatum {
  /** 경쟁도 (0~100) */
  x: number;
  /** 평균 반응도 (%) */
  y: number;
  /** 키워드 라벨 */
  keyword: string;
  /** 기회 점수 */
  opportunity: number;
}

/** 기회 점수에 따른 점 색상 */
function pointColor(opportunity: number): string {
  if (opportunity >= 70) return "#10b981"; // 높음
  if (opportunity >= 40) return "#f59e0b"; // 보통
  return "#94a3b8"; // 낮음
}

/** 다크 테마 커스텀 툴팁 */
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: PointDatum }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0].payload;
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "6px",
        padding: "8px 10px",
        color: "#111827",
        fontSize: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      <p style={{ fontWeight: 700 }}>{p.keyword}</p>
      <p style={{ color: "#6b7280" }}>경쟁도: {p.x}</p>
      <p style={{ color: "#6b7280" }}>평균 반응도: {p.y}%</p>
      <p style={{ color: "#6b7280" }}>기회 점수: {p.opportunity}</p>
    </div>
  );
}

export default function KeywordOpportunityChart({
  data,
  height = 300,
}: KeywordOpportunityChartProps) {
  const points: PointDatum[] = data.map((d) => ({
    x: d.competitionScore,
    y: Math.round(d.avgReactionRatio * 1000) / 10,
    keyword: d.keyword,
    opportunity: d.opportunityScore,
  }));

  if (points.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 20, right: 24, bottom: 24, left: 4 }}>
        <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
        <XAxis
          type="number"
          dataKey="x"
          name="경쟁도"
          domain={[0, 100]}
          tick={{ fill: "#6b7280", fontSize: 11 }}
          label={{
            value: "경쟁도 (낮을수록 ←)",
            position: "insideBottom",
            offset: -10,
            fill: "#6b7280",
            fontSize: 11,
          }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name="평균 반응도(%)"
          tick={{ fill: "#6b7280", fontSize: 11 }}
          label={{
            value: "반응도 % (높을수록 ↑)",
            angle: -90,
            position: "insideLeft",
            fill: "#6b7280",
            fontSize: 11,
          }}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3" }} />
        <Scatter data={points}>
          {points.map((p) => (
            <Cell key={p.keyword} fill={pointColor(p.opportunity)} />
          ))}
          <LabelList
            dataKey="keyword"
            position="top"
            style={{ fontSize: 10, fill: "#374151" }}
          />
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
