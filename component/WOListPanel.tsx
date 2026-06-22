"use client";

import { useState } from "react";
import { Search, Plus, SlidersHorizontal, Zap } from "lucide-react";
import { WorkOrder } from "@/types/types";
import { AVATAR_COLORS, PRIORITY_CONFIG, STATUS_CONFIG } from "@/types/tokens";

type Tab = "open" | "done" | "all";

interface WOListProps {
  workOrders: WorkOrder[];
  selectedId: string | null;
  onSelect: (wo: WorkOrder) => void;
  onNew: () => void;
}

const CATEGORY_META: Record<string, { dot: string; bg: string; text: string }> = {
  Plumbing:             { dot: "#3B82F6", bg: "#EFF6FF", text: "#1D4ED8" },
  Electrical:           { dot: "#F97316", bg: "#FFF7ED", text: "#C2410C" },
  "HVAC / Refrigeration": { dot: "#14B8A6", bg: "#F0FDFA", text: "#0F766E" },
  Sanitation:           { dot: "#A855F7", bg: "#FAF5FF", text: "#7E22CE" },
  General:              { dot: "#6B7280", bg: "#F9FAFB", text: "#374151" },
};

export function WOListPanel({ workOrders, selectedId, onSelect, onNew }: WOListProps) {
  const [tab, setTab] = useState<Tab>("open");
  const [search, setSearch] = useState("");

  const filtered = workOrders.filter((wo) => {
    const matchTab =
      tab === "all" ? true : tab === "done" ? wo.status === "done" : wo.status !== "done";
    const matchSearch =
      search === "" ||
      wo.title.toLowerCase().includes(search.toLowerCase()) ||
      wo.id.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: "open", label: "Open" },
    { key: "done", label: "Done" },
    { key: "all", label: "All" },
  ];

  const openCount = workOrders.filter((w) => w.status !== "done").length;
  const overdueCount = workOrders.filter((w) => w.overdue).length;

  return (
    <div
      style={{
        width: 312,
        flexShrink: 0,
        borderRight: "1px solid #E8EAFF",
        display: "flex",
        flexDirection: "column",
        background: "#F8FAFF",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px 16px 0",
          background: "#fff",
          borderBottom: "1px solid #E8EAFF",
          boxShadow: "0 1px 0 #E8EAFF",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#0F172A",
                margin: 0,
                letterSpacing: "-0.025em",
              }}
            >
              Work Orders
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <span
                style={{
                  fontSize: 11,
                  color: "#64748B",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#22C55E",
                    boxShadow: "0 0 0 3px rgba(34,197,94,0.2)",
                  }}
                />
                {openCount} active
              </span>
              {overdueCount > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    background: "#FEF2F2",
                    color: "#DC2626",
                    border: "1px solid #FECACA",
                    padding: "1px 7px",
                    borderRadius: 99,
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <Zap size={9} strokeWidth={2.5} />
                  {overdueCount} overdue
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onNew}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "8px 14px",
              background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "-0.01em",
              boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 6px 18px rgba(99,102,241,0.5)";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 4px 12px rgba(99,102,241,0.35)";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            }}
          >
            <Plus size={13} strokeWidth={2.5} /> New
          </button>
        </div>

        {/* Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#F8FAFF",
            borderRadius: 10,
            padding: "0 12px",
            height: 36,
            marginBottom: 12,
            border: "1.5px solid #E0E7FF",
            transition: "border-color 0.15s",
          }}
          onFocusCapture={(e) =>
            ((e.currentTarget as HTMLDivElement).style.borderColor = "#6366F1")
          }
          onBlurCapture={(e) =>
            ((e.currentTarget as HTMLDivElement).style.borderColor = "#E0E7FF")
          }
        >
          <Search size={13} color="#A5B4FC" strokeWidth={2} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders…"
            style={{
              border: "none",
              background: "transparent",
              fontSize: 12,
              color: "#0F172A",
              outline: "none",
              width: "100%",
            }}
          />
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0 }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: "9px 16px",
                fontSize: 12,
                fontWeight: tab === t.key ? 700 : 400,
                color: tab === t.key ? "#6366F1" : "#94A3B8",
                background: "none",
                border: "none",
                borderBottom: `2.5px solid ${tab === t.key ? "#6366F1" : "transparent"}`,
                cursor: "pointer",
                marginBottom: -1,
                letterSpacing: "-0.01em",
                transition: "all 0.15s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          fontSize: 11,
          color: "#94A3B8",
        }}
      >
        <span>
          <strong style={{ color: "#475569", fontWeight: 700 }}>{filtered.length}</strong> orders
        </span>
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: "none",
            fontSize: 11,
            color: "#64748B",
            cursor: "pointer",
            padding: "4px 8px",
            borderRadius: 6,
          }}
        >
          <SlidersHorizontal size={11} /> Sort
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 10px 16px" }}>
        {filtered.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "56px 20px",
              color: "#94A3B8",
              fontSize: 13,
            }}
          >
            <i
              className="ti ti-clipboard-off"
              style={{ fontSize: 36, color: "#E0E7FF", display: "block", marginBottom: 10 }}
            />
            No work orders found
          </div>
        )}
        {filtered.map((wo) => {
          const status = STATUS_CONFIG[wo.status];
          const priority = PRIORITY_CONFIG[wo.priority];
          const catMeta = CATEGORY_META[wo.category] ?? CATEGORY_META["General"];
          const isSelected = wo.id === selectedId;

          return (
            <div
              key={wo.id}
              onClick={() => onSelect(wo)}
              style={{
                padding: "13px 14px",
                borderRadius: 12,
                border: `1.5px solid ${isSelected ? "#6366F1" : "#EEF0FF"}`,
                background: isSelected
                  ? "linear-gradient(145deg, #F5F3FF 0%, #EEF2FF 100%)"
                  : "#fff",
                marginBottom: 6,
                cursor: "pointer",
                transition: "all 0.15s ease",
                boxShadow: isSelected
                  ? "0 0 0 3px rgba(99,102,241,0.12), 0 2px 8px rgba(99,102,241,0.1)"
                  : "0 1px 3px rgba(15,23,42,0.04)",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  (e.currentTarget as HTMLDivElement).style.boxShadow =
                    "0 4px 12px rgba(99,102,241,0.1)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#C7D2FE";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  (e.currentTarget as HTMLDivElement).style.boxShadow =
                    "0 1px 3px rgba(15,23,42,0.04)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#EEF0FF";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                }
              }}
            >
              {/* Top: category pill + id */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 7,
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    background: catMeta.bg,
                    color: catMeta.text,
                    padding: "2px 8px",
                    borderRadius: 99,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {wo.category}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: isSelected ? "#818CF8" : "#CBD5E1",
                    fontFamily: "monospace",
                    fontWeight: 600,
                  }}
                >
                  {wo.id}
                </span>
              </div>

              {/* Title */}
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: isSelected ? "#3730A3" : "#0F172A",
                  margin: "0 0 5px",
                  lineHeight: 1.4,
                  letterSpacing: "-0.015em",
                }}
              >
                {wo.title}
              </p>

              {/* Requester */}
              <p
                style={{
                  fontSize: 11,
                  color: "#94A3B8",
                  margin: "0 0 10px",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <i className="ti ti-user" style={{ fontSize: 11 }} aria-hidden="true" />
                {wo.requestedBy} · {wo.dueDate}
              </p>

              {/* Badges + avatars */}
              <div
                style={{
                  display: "flex",
                  gap: 5,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                {/* Status pill with animated dot */}
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 10,
                    fontWeight: 600,
                    background: status.bg,
                    color: status.text,
                    border: `1px solid ${status.border}`,
                    padding: "3px 8px",
                    borderRadius: 99,
                  }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: status.dot,
                      display: "inline-block",
                      flexShrink: 0,
                      ...(wo.status === "in_progress"
                        ? { animation: "pulse 2s ease-in-out infinite" }
                        : {}),
                    }}
                  />
                  {status.label}
                </span>

                {wo.overdue && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      background: "#FEF2F2",
                      color: "#DC2626",
                      border: "1px solid #FECACA",
                      padding: "3px 8px",
                      borderRadius: 99,
                    }}
                  >
                    Overdue
                  </span>
                )}

                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    background: priority.bg,
                    color: priority.text,
                    border: `1px solid ${priority.border}`,
                    padding: "3px 8px",
                    borderRadius: 99,
                  }}
                >
                  {priority.label}
                </span>

                {/* Assignee avatars */}
                <div style={{ marginLeft: "auto", display: "flex" }}>
                  {wo.assignees.slice(0, 3).map((a, i) => {
                    const av = AVATAR_COLORS[a.color];
                    return (
                      <div
                        key={i}
                        title={a.name}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          background: av.bg,
                          color: av.text,
                          fontSize: 8,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginLeft: i > 0 ? -6 : 0,
                          border: "2px solid #fff",
                          flexShrink: 0,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        }}
                      >
                        {a.initials}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 currentColor; }
          50% { opacity: 0.7; box-shadow: 0 0 0 3px transparent; }
        }
      `}</style>
    </div>
  );
}