"use client";

import { useState } from "react";
import { Search, Plus, SlidersHorizontal } from "lucide-react";
import { WorkOrder } from "@/types/types";
import { AVATAR_COLORS, PRIORITY_CONFIG, STATUS_CONFIG } from "@/types/tokens";

type Tab = "open" | "done" | "all";

interface WOListProps {
  workOrders: WorkOrder[];
  selectedId: string | null;
  onSelect: (wo: WorkOrder) => void;
  onNew: () => void;
}

const CATEGORY_DOT: Record<string, string> = {
  Plumbing: "#3B82F6",
  Electrical: "#F97316",
  "HVAC / Refrigeration": "#14B8A6",
  Sanitation: "#A855F7",
  General: "#6B7280",
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

  return (
    <div
      style={{
        width: 304,
        flexShrink: 0,
        borderRight: "1px solid #E5E7EB",
        display: "flex",
        flexDirection: "column",
        background: "#F8FAFC",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ padding: "18px 16px 0", background: "#fff", borderBottom: "1px solid #E5E7EB" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <h1 style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", margin: 0, letterSpacing: "-0.01em" }}>
              Work Orders
            </h1>
            <p style={{ fontSize: 11, color: "#94A3B8", margin: "2px 0 0" }}>
              {openCount} active
            </p>
          </div>
          <button
            onClick={onNew}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 12px",
              background: "#0F172A",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              letterSpacing: "-0.01em",
            }}
          >
            <Plus size={12} strokeWidth={2.5} /> New
          </button>
        </div>

        {/* Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#F1F5F9",
            borderRadius: 8,
            padding: "0 10px",
            height: 34,
            marginBottom: 12,
            border: "1px solid transparent",
            transition: "border-color 0.15s",
          }}
        >
          <Search size={13} color="#94A3B8" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or ID…"
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
                padding: "8px 14px",
                fontSize: 12,
                fontWeight: tab === t.key ? 600 : 400,
                color: tab === t.key ? "#0F172A" : "#94A3B8",
                background: "none",
                border: "none",
                borderBottom: `2px solid ${tab === t.key ? "#0F172A" : "transparent"}`,
                cursor: "pointer",
                marginBottom: -1,
                letterSpacing: "-0.01em",
                transition: "color 0.12s",
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
          <strong style={{ color: "#475569", fontWeight: 600 }}>{filtered.length}</strong> orders
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
          }}
        >
          <SlidersHorizontal size={11} /> Sort
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 10px 12px" }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 20px", color: "#94A3B8", fontSize: 13 }}>
            No work orders found
          </div>
        )}
        {filtered.map((wo) => {
          const status = STATUS_CONFIG[wo.status];
          const priority = PRIORITY_CONFIG[wo.priority];
          const catDot = CATEGORY_DOT[wo.category] ?? "#6B7280";
          const isSelected = wo.id === selectedId;

          return (
            <div
              key={wo.id}
              onClick={() => onSelect(wo)}
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                border: `1px solid ${isSelected ? "#0F172A" : "#E2E8F0"}`,
                background: isSelected ? "#0F172A" : "#fff",
                marginBottom: 5,
                cursor: "pointer",
                transition: "all 0.12s",
                boxShadow: isSelected ? "0 2px 8px rgba(15,23,42,0.12)" : "none",
              }}
            >
              {/* Top row: title + id */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: isSelected ? "#F8FAFC" : "#0F172A",
                    margin: 0,
                    lineHeight: 1.4,
                    flex: 1,
                    paddingRight: 8,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {wo.title}
                </p>
                <span style={{ fontSize: 10, color: isSelected ? "rgba(248,250,252,0.45)" : "#94A3B8", flexShrink: 0, fontFamily: "monospace" }}>
                  {wo.id}
                </span>
              </div>

              {/* Meta row */}
              <p style={{ fontSize: 11, color: isSelected ? "rgba(248,250,252,0.5)" : "#94A3B8", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 5 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: catDot,
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
                {wo.category} · {wo.requestedBy}
              </p>

              {/* Badges row */}
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 10,
                    fontWeight: 500,
                    background: isSelected ? "rgba(255,255,255,0.12)" : status.bg,
                    color: isSelected ? "rgba(255,255,255,0.75)" : status.text,
                    border: `1px solid ${isSelected ? "rgba(255,255,255,0.15)" : status.border}`,
                    padding: "2px 7px",
                    borderRadius: 99,
                  }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: isSelected ? "rgba(255,255,255,0.6)" : status.dot,
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
                  {status.label}
                </span>

                {wo.overdue && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      background: isSelected ? "rgba(239,68,68,0.2)" : "#FEF2F2",
                      color: isSelected ? "#FCA5A5" : "#B91C1C",
                      border: `1px solid ${isSelected ? "rgba(239,68,68,0.3)" : "#FECACA"}`,
                      padding: "2px 7px",
                      borderRadius: 99,
                    }}
                  >
                    Overdue
                  </span>
                )}

                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    background: isSelected ? "rgba(255,255,255,0.1)" : priority.bg,
                    color: isSelected ? "rgba(255,255,255,0.6)" : priority.text,
                    border: `1px solid ${isSelected ? "rgba(255,255,255,0.12)" : priority.border}`,
                    padding: "2px 7px",
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
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: isSelected ? "rgba(255,255,255,0.15)" : av.bg,
                          color: isSelected ? "rgba(255,255,255,0.8)" : av.text,
                          fontSize: 8,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginLeft: i > 0 ? -5 : 0,
                          border: `1.5px solid ${isSelected ? "rgba(255,255,255,0.2)" : "#fff"}`,
                          flexShrink: 0,
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
    </div>
  );
}