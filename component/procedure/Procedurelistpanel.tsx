"use client";

import { useMemo, useState } from "react";


import { Procedure, ProcedureStatus } from "@/redux/procedure/Procedureapi";
import { BRAND_GRADIENT, STATUS_STYLES, timeAgo } from "@/types/Procedureui";

interface ProcedureListPanelProps {
  procedures: Procedure[];
  total: number;
  isFetching: boolean;
  selectedId: number | null;
  onSelect: (procedure: Procedure) => void;
  onNew: () => void;
  status: ProcedureStatus | "all";
  onStatusChange: (status: ProcedureStatus | "all") => void;
  search: string;
  onSearchChange: (search: string) => void;
}

const STATUS_TABS: { key: ProcedureStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "draft", label: "Draft" },
];

export function ProcedureListPanel({
  procedures,
  total,
  isFetching,
  selectedId,
  onSelect,
  onNew,
  status,
  onStatusChange,
  search,
  onSearchChange,
}: ProcedureListPanelProps) {
  const [searchDraft, setSearchDraft] = useState(search);

  const commitSearch = () => onSearchChange(searchDraft.trim());

  return (
    <aside
      style={{
        width: 380,
        minWidth: 380,
        borderRight: "1px solid #EEF0F6",
        display: "flex",
        flexDirection: "column",
        background: "#FFFFFF",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ padding: "20px 20px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: 0, letterSpacing: "-0.02em" }}>
              Procedure library
            </h1>
            <p style={{ fontSize: 12.5, color: "#9CA3AF", margin: "2px 0 0" }}>
              {total} template{total === 1 ? "" : "s"}
            </p>
          </div>
          <button
            onClick={onNew}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 14px",
              background: BRAND_GRADIENT,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 6px 16px rgba(99,102,241,0.3)",
              whiteSpace: "nowrap",
            }}
          >
            <i className="ti ti-plus" style={{ fontSize: 14 }} aria-hidden="true" />
            New
          </button>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 12 }}>
          <i
            className="ti ti-search"
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 15,
              color: "#9CA3AF",
            }}
            aria-hidden="true"
          />
          <input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commitSearch()}
            onBlur={commitSearch}
            placeholder="Search procedures…"
            style={{
              width: "100%",
              padding: "9px 12px 9px 34px",
              borderRadius: 10,
              border: "1px solid #E5E7EB",
              fontSize: 13,
              color: "#111827",
              outline: "none",
              background: "#F9FAFB",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Status tabs */}
        <div style={{ display: "flex", gap: 6, background: "#F3F4F6", padding: 4, borderRadius: 10 }}>
          {STATUS_TABS.map((tab) => {
            const active = status === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onStatusChange(tab.key)}
                style={{
                  flex: 1,
                  padding: "7px 0",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: active ? "#4F46E5" : "#6B7280",
                  background: active ? "#fff" : "transparent",
                  boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 12px 16px" }}>
        {isFetching && procedures.length === 0 ? (
          <div style={{ padding: "40px 8px", textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
            Loading procedures…
          </div>
        ) : procedures.length === 0 ? (
          <EmptyState hasSearch={!!search} onNew={onNew} />
        ) : (
          procedures.map((p) => (
            <ProcedureCard key={p.id} procedure={p} selected={p.id === selectedId} onClick={() => onSelect(p)} />
          ))
        )}
      </div>
    </aside>
  );
}

function EmptyState({ hasSearch, onNew }: { hasSearch: boolean; onNew: () => void }) {
  return (
    <div style={{ padding: "48px 16px", textAlign: "center" }}>
      <div
        style={{
          width: 44,
          height: 44,
          margin: "0 auto 12px",
          borderRadius: 12,
          background: "#EEF2FF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <i className="ti ti-clipboard-list" style={{ fontSize: 20, color: "#6366F1" }} aria-hidden="true" />
      </div>
      <p style={{ fontSize: 13.5, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
        {hasSearch ? "No matching procedures" : "No procedures yet"}
      </p>
      <p style={{ fontSize: 12.5, color: "#9CA3AF", margin: "0 0 14px" }}>
        {hasSearch
          ? "Try a different search term or clear your filters."
          : "Build a reusable checklist or inspection template to attach to work orders."}
      </p>
      {!hasSearch && (
        <button
          onClick={onNew}
          style={{
            padding: "8px 16px",
            background: "#EEF2FF",
            color: "#4F46E5",
            border: "1px solid #E0E7FF",
            borderRadius: 9,
            fontSize: 12.5,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Create your first procedure
        </button>
      )}
    </div>
  );
}

function ProcedureCard({
  procedure,
  selected,
  onClick,
}: {
  procedure: Procedure;
  selected: boolean;
  onClick: () => void;
}) {
  const statusStyle = STATUS_STYLES[procedure.status];
  const extraTags = Math.max(0, procedure.tags.length - 3);
  const requiredCount = useMemo(
    () => procedure.fields.filter((f) => f.type !== "section_header").length,
    [procedure.fields],
  );

  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        display: "block",
        padding: "13px 14px",
        marginBottom: 8,
        borderRadius: 12,
        border: selected ? "1.5px solid #A5B4FC" : "1.5px solid transparent",
        background: selected ? "#EEF2FF" : "#FAFAFC",
        cursor: "pointer",
        transition: "all 0.12s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: "#111827",
              margin: 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {procedure.title}
          </p>
          <p style={{ fontSize: 12, color: "#9CA3AF", margin: "3px 0 0" }}>
            {requiredCount} field{requiredCount === 1 ? "" : "s"} · updated {timeAgo(procedure.updatedAt)}
          </p>
        </div>
        <span
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "3px 9px",
            borderRadius: 999,
            fontSize: 10.5,
            fontWeight: 700,
            color: statusStyle.fg,
            background: statusStyle.bg,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusStyle.dot }} />
          {statusStyle.label}
        </span>
      </div>

      {(procedure.tags.length > 0 || procedure.scoringEnabled) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 9 }}>
          {procedure.scoringEnabled && (
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: "#B45309",
                background: "#FFFBEB",
                border: "1px solid #FDE68A",
                borderRadius: 6,
                padding: "2px 7px",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <i className="ti ti-target-arrow" style={{ fontSize: 11 }} aria-hidden="true" />
              Goal {procedure.goalScore}
            </span>
          )}
          {procedure.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: "#4B5563",
                background: "#F3F4F6",
                borderRadius: 6,
                padding: "2px 7px",
              }}
            >
              {tag}
            </span>
          ))}
          {extraTags > 0 && (
            <span style={{ fontSize: 10.5, fontWeight: 600, color: "#9CA3AF", padding: "2px 2px" }}>
              +{extraTags}
            </span>
          )}
        </div>
      )}
    </button>
  );
}