"use client";
import { Loader2 } from "lucide-react";

export function ChartLoading() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 150, color: "#C7D2FE" }}>
      <Loader2 size={20} style={{ animation: "spin 0.8s linear infinite" }} />
    </div>
  );
}