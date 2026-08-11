"use client";
import { ChevronDown, Building2, Download } from "lucide-react";

export function ReportingHeader({
  rangeLabel,
  onCycleRange,
  onExport,
  exporting,
}: {
  rangeLabel: string;
  onCycleRange: () => void;
  onExport: () => void;
  exporting: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: 0, letterSpacing: "-0.02em" }}>
          Reporting
        </h1>
        <button
          onClick={onCycleRange}
          style={{
            display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600,
            color: "#6366F1", background: "#EEF2FF", border: "1px solid #E0E7FF", borderRadius: 8,
            padding: "6px 10px", cursor: "pointer",
          }}
        >
          {rangeLabel}
          <ChevronDown size={13} />
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
       
        <button
          onClick={onExport}
          disabled={exporting}
          style={{
            display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 700,
            color: "#fff", background: "linear-gradient(135deg, #6366F1, #8B5CF6)", border: "none",
            borderRadius: 10, padding: "9px 16px", cursor: exporting ? "wait" : "pointer",
            boxShadow: "0 4px 14px rgba(99,102,241,0.35)", opacity: exporting ? 0.7 : 1,
          }}
        >
          <Download size={14} />
          {exporting ? "Exporting…" : "Export to PDF"}
        </button>
      </div>
    </div>
  );
}