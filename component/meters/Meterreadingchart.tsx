"use client";

import { useMemo, useState } from "react";
import { ChartPoint } from "@/redux/Meter/Meterapi";

interface Props {
  points: ChartPoint[];
  unit: string;
  height?: number;
}

const PAD = { top: 16, right: 16, bottom: 28, left: 44 };

export function MeterReadingChart({ points, unit, height = 200 }: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const width = 640;

  const { path, areaPath, dots, yTicks, xLabels } = useMemo(() => {
    if (points.length === 0) {
      return { path: "", areaPath: "", dots: [], yTicks: [], xLabels: [] };
    }

    const values = points.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const innerW = width - PAD.left - PAD.right;
    const innerH = height - PAD.top - PAD.bottom;

    const xFor = (i: number) =>
      points.length === 1 ? PAD.left + innerW / 2 : PAD.left + (i / (points.length - 1)) * innerW;
    const yFor = (v: number) => PAD.top + innerH - ((v - min) / range) * innerH;

    const coords = points.map((p, i) => ({ x: xFor(i), y: yFor(p.value), point: p }));

    const path = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
    const areaPath =
      `M ${coords[0].x} ${PAD.top + innerH} ` +
      coords.map((c) => `L ${c.x} ${c.y}`).join(" ") +
      ` L ${coords[coords.length - 1].x} ${PAD.top + innerH} Z`;

    const yTicks = [min, min + range / 2, max].map((v) => ({
      value: Math.round(v * 100) / 100,
      y: yFor(v),
    }));

    const step = Math.max(1, Math.floor(points.length / 4));
    const xLabels = coords
      .filter((_, i) => i % step === 0 || i === coords.length - 1)
      .map((c) => ({
        x: c.x,
        label: new Date(c.point.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      }));

    return { path, areaPath, dots: coords, yTicks, xLabels };
  }, [points, height]);

  if (points.length === 0) {
    return (
      <div
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#9CA3AF",
          fontSize: 13,
          background: "#FAFAFB",
          borderRadius: 12,
          border: "1px solid #F0F0F2",
        }}
      >
        No readings in this range yet
      </div>
    );
  }

  const hovered = hoverIdx !== null ? dots[hoverIdx] : null;

  return (
    <div style={{ position: "relative" }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", height, display: "block" }}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id="meterAreaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366F1" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
          </linearGradient>
        </defs>

        {yTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={PAD.left}
              x2={width - PAD.right}
              y1={t.y}
              y2={t.y}
              stroke="#F0F0F2"
              strokeWidth={1}
            />
            <text x={PAD.left - 8} y={t.y + 4} textAnchor="end" fontSize={10} fill="#9CA3AF">
              {t.value}
            </text>
          </g>
        ))}

        <path d={areaPath} fill="url(#meterAreaFill)" />
        <path d={path} fill="none" stroke="#6366F1" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {dots.map((d, i) => (
          <circle
            key={i}
            cx={d.x}
            cy={d.y}
            r={d.point.triggeredWorkOrder ? 4.5 : hoverIdx === i ? 4 : 2.5}
            fill={d.point.triggeredWorkOrder ? "#EF4444" : "#6366F1"}
            stroke="#fff"
            strokeWidth={1.5}
            onMouseEnter={() => setHoverIdx(i)}
            style={{ cursor: "pointer" }}
          />
        ))}

        {xLabels.map((l, i) => (
          <text key={i} x={l.x} y={height - 8} textAnchor="middle" fontSize={10} fill="#9CA3AF">
            {l.label}
          </text>
        ))}
      </svg>

      {hovered && (
        <div
          style={{
            position: "absolute",
            left: Math.min(Math.max(hovered.x - 55, 0), width - 110),
            top: Math.max(hovered.y - 54, 0),
            background: "#111827",
            color: "#fff",
            borderRadius: 8,
            padding: "6px 10px",
            fontSize: 11,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
          }}
        >
          <div style={{ fontWeight: 700 }}>
            {hovered.point.value} {unit}
          </div>
          <div style={{ color: "#9CA3AF" }}>
            {new Date(hovered.point.createdAt).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </div>
          {hovered.point.triggeredWorkOrder && (
            <div style={{ color: "#FCA5A5", fontWeight: 600 }}>Triggered a work order</div>
          )}
        </div>
      )}
    </div>
  );
}