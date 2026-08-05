"use client";

import { useMemo, useState } from "react";
import { Meter, MeterStatus } from "@/redux/Meter/Meterapi";
import { METER_STATUS_CONFIG } from "@/types/Metertokens";


interface Props {
  meters: Meter[];
  selectedId: number | null;
  onSelect: (meter: Meter) => void;
  onNew: () => void;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "No readings yet";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

const STATUS_FILTERS: { key: MeterStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "triggered", label: "Triggered" },
  { key: "stable", label: "Stable" },
  { key: "pending", label: "Pending" },
];

export function MeterListPanel({ meters, selectedId, onSelect, onNew }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<MeterStatus | "all">("all");

  const filtered = useMemo(() => {
    return meters.filter((m) => {
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          m.name.toLowerCase().includes(q) ||
          (m.equipmentName ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [meters, search, statusFilter]);

  return (
    <div
      style={{
        width: 360,
        borderRight: "1px solid #EEF0F4",
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        height: "100%",
      }}
    >
      {/* Header */}
      <div style={{ padding: "18px 18px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: "#111827", margin: 0, letterSpacing: "-0.02em" }}>
            Meters
          </h1>
          <button
            onClick={onNew}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
            }}
          >
            <i className="ti ti-plus" style={{ fontSize: 13 }} aria-hidden="true" />
            New meter
          </button>
        </div>

        <div style={{ position: "relative", marginBottom: 10 }}>
          <i
            className="ti ti-search"
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 14,
              color: "#9CA3AF",
            }}
            aria-hidden="true"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search meters or equipment…"
            style={{
              width: "100%",
              padding: "9px 12px 9px 34px",
              borderRadius: 10,
              border: "1px solid #E5E7EB",
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
              background: "#FAFAFB",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {STATUS_FILTERS.map((f) => {
            const active = statusFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                style={{
                  padding: "5px 11px",
                  borderRadius: 8,
                  fontSize: 11.5,
                  fontWeight: 600,
                  border: active ? "1px solid #6366F1" : "1px solid #E5E7EB",
                  background: active ? "#EEF2FF" : "#fff",
                  color: active ? "#4338CA" : "#6B7280",
                  cursor: "pointer",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 10px 16px" }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#9CA3AF", fontSize: 13 }}>
            No meters match this view.
          </div>
        )}

        {filtered.map((m) => {
          const cfg = METER_STATUS_CONFIG[m.status];
          const active = m.id === selectedId;

          return (
            <button
              key={m.id}
              onClick={() => onSelect(m)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "12px 12px",
                marginBottom: 6,
                borderRadius: 12,
                border: active ? "1px solid #C7D2FE" : "1px solid transparent",
                background: active ? "#EEF2FF" : "#fff",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = "#FAFAFB";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = "#fff";
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: "#111827",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {m.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
                    {m.equipmentName ?? "Unlinked equipment"}
                  </div>
                </div>

                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "2px 8px",
                    borderRadius: 999,
                    fontSize: 10.5,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    background: cfg.bg,
                    color: cfg.text,
                    border: `1px solid ${cfg.border}`,
                  }}
                >
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot }} />
                  {cfg.label}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#374151" }}>
                  {m.lastReadingValue ?? "—"}
                </span>
                <span style={{ fontSize: 11.5, color: "#9CA3AF" }}>{m.unit}</span>
                <span style={{ fontSize: 11, color: "#C4C8D2", marginLeft: "auto" }}>
                  {timeAgo(m.lastReadingAt)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}