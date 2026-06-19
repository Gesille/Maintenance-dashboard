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

const CATEGORY_LEFT_COLORS: Record<string, string> = {
  Plumbing: "#3B82F6",
  Electrical: "#F97316",
  "HVAC / Refrigeration": "#14B8A6",
  Sanitation: "#A855F7",
  General: "#6B7280",
};

export function WOListPanel({
  workOrders,
  selectedId,
  onSelect,
  onNew,
}: WOListProps) {
  const [tab, setTab] = useState<Tab>("open");
  const [search, setSearch] = useState("");

  const filtered = workOrders.filter((wo) => {
    const matchTab =
      tab === "all"
        ? true
        : tab === "done"
          ? wo.status === "done"
          : wo.status !== "done";
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

  return (
    <div
      style={{
        width: 300,
        flexShrink: 0,
        borderRight: "1px solid #E5E7EB",
        display: "flex",
        flexDirection: "column",
        background: "#FAFAFA",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 16px 0",
          background: "#fff",
          borderBottom: "1px solid #E5E7EB",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <h1
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#111827",
              margin: 0,
            }}
          >
            Work orders
          </h1>
          <button
            onClick={onNew}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 10px",
              background: "#2563EB",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Plus size={13} /> New
          </button>
        </div>

        {/* Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#F3F4F6",
            borderRadius: 7,
            padding: "0 10px",
            height: 33,
            marginBottom: 12,
          }}
        >
          <Search size={13} color="#9CA3AF" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search work orders…"
            style={{
              border: "none",
              background: "transparent",
              fontSize: 13,
              color: "#111827",
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
                padding: "7px 14px",
                fontSize: 12,
                fontWeight: 500,
                color: tab === t.key ? "#2563EB" : "#6B7280",
                background: "none",
                border: "none",
                borderBottom: `2px solid ${tab === t.key ? "#2563EB" : "transparent"}`,
                cursor: "pointer",
                marginBottom: -1,
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
          color: "#9CA3AF",
        }}
      >
        <span>
          <strong style={{ color: "#374151" }}>{filtered.length}</strong> orders
        </span>
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: "none",
            fontSize: 11,
            color: "#6B7280",
            cursor: "pointer",
          }}
        >
          <SlidersHorizontal size={12} /> Sort
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 12px 12px" }}>
        {filtered.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              color: "#9CA3AF",
              fontSize: 13,
            }}
          >
            No work orders found
          </div>
        )}
        {filtered.map((wo) => {
          const status = STATUS_CONFIG[wo.status];
          const priority = PRIORITY_CONFIG[wo.priority];
          const catColor = CATEGORY_LEFT_COLORS[wo.category] ?? "#6B7280";
          const isSelected = wo.id === selectedId;

          return (
            <div
              key={wo.id}
              onClick={() => onSelect(wo)}
              style={{
                padding: "12px 12px 12px 14px",
                borderRadius: 8,

                borderTop: `1px solid ${isSelected ? "#2563EB" : "#E5E7EB"}`,
                borderRight: `1px solid ${isSelected ? "#2563EB" : "#E5E7EB"}`,
                borderBottom: `1px solid ${isSelected ? "#2563EB" : "#E5E7EB"}`,
                borderLeft: `3px solid ${catColor}`,
                background: isSelected ? "#EFF6FF" : "#fff",
                marginBottom: 6,
                cursor: "pointer",
                transition: "border-color 0.1s, background 0.1s",
              }}
            >
              {/* Top row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 5,
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#111827",
                    margin: 0,
                    lineHeight: 1.35,
                    flex: 1,
                    paddingRight: 8,
                  }}
                >
                  {wo.title}
                </p>
                <span style={{ fontSize: 11, color: "#9CA3AF", flexShrink: 0 }}>
                  {wo.id}
                </span>
              </div>

              {/* Requester */}
              <p style={{ fontSize: 11, color: "#9CA3AF", margin: "0 0 8px" }}>
                {wo.requestedBy} · {wo.category}
              </p>

              {/* Badges */}
              <div
                style={{
                  display: "flex",
                  gap: 5,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                {/* Status */}
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 10,
                    fontWeight: 500,
                    background: status.bg,
                    color: status.text,
                    border: `1px solid ${status.border}`,
                    padding: "2px 7px",
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
                    }}
                  />
                  {status.label}
                </span>

                {/* Overdue */}
                {wo.overdue && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                      fontSize: 10,
                      fontWeight: 500,
                      background: "#FEF2F2",
                      color: "#B91C1C",
                      border: "1px solid #FECACA",
                      padding: "2px 7px",
                      borderRadius: 99,
                    }}
                  >
                    <i
                      className="ti ti-clock"
                      style={{ fontSize: 10 }}
                      aria-hidden="true"
                    />{" "}
                    Overdue
                  </span>
                )}

                {/* Priority */}
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    background: priority.bg,
                    color: priority.text,
                    border: `1px solid ${priority.border}`,
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
                          background: av.bg,
                          color: av.text,
                          fontSize: 8,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginLeft: i > 0 ? -5 : 0,
                          border: "1.5px solid #fff",
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
