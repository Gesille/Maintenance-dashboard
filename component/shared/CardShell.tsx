"use client";
import { ChevronDown, Plus } from "lucide-react";

export function CardShell({
  title,
  children,
  onAdd,
}: {
  title: string;
  children: React.ReactNode;
  onAdd?: boolean;
}) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #EEF0FF",
        borderRadius: 16,
        padding: "18px 20px 20px",
        boxShadow: "0 1px 2px rgba(15,23,42,0.03)",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.01em" }}>
            {title}
          </span>
          <ChevronDown size={14} color="#94A3B8" />
        </div>
        {onAdd && (
          <button
            style={{
              width: 26, height: 26, borderRadius: 8, border: "1px solid #E8EAFF",
              background: "#FAFBFF", display: "flex", alignItems: "center",
              justifyContent: "center", cursor: "pointer", color: "#6366F1",
            }}
            aria-label={`Add to ${title}`}
          >
            <Plus size={14} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}