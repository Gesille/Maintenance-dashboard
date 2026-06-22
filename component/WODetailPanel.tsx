"use client";

import { useState } from "react";
import { MessageSquare, Edit3, MoreHorizontal, Share2, MapPin, Calendar, Hash } from "lucide-react";
import { PRIORITY_CONFIG, CATEGORY_COLORS, STATUS_CONFIG, AVATAR_COLORS } from "@/types/tokens";
import { WorkOrder, WOStatus } from "@/types/types";

interface WODetailProps {
  wo: WorkOrder;
  onStatusChange: (id: string, status: WOStatus) => void;
  onChecklistToggle: (id: string, index: number) => void;
}

const STATUS_ORDER: WOStatus[] = ["open", "in_progress", "on_hold", "done"];

export function WODetailPanel({ wo, onStatusChange, onChecklistToggle }: WODetailProps) {
  const [note, setNote] = useState("");

  const checkedCount = wo.checklist.filter((c) => c.done).length;
  const checklistPct = wo.checklist.length > 0
    ? Math.round((checkedCount / wo.checklist.length) * 100)
    : 0;

  const priority = PRIORITY_CONFIG[wo.priority];
  const category = CATEGORY_COLORS[wo.category] ?? CATEGORY_COLORS["General"];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#fff" }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{
        padding: "14px 24px",
        borderBottom: "1px solid #E5E7EB",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
      }}>
        {/* Left: category chip + id + title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <span style={{
              fontSize: 10, fontWeight: 600,
              background: category.bg, color: category.text,
              padding: "2px 9px", borderRadius: 99,
              textTransform: "uppercase", letterSpacing: "0.06em",
            }}>
              {wo.category}
            </span>
            <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500 }}>{wo.id}</span>
          </div>

          <h2 style={{ fontSize: 17, fontWeight: 600, color: "#111827", margin: "0 0 4px", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {wo.title}
          </h2>

          <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
            <Calendar size={11} style={{ flexShrink: 0 }} />
            {wo.completedOn
              ? `Completed on ${wo.completedOn}`
              : `Due ${wo.dueDate}${wo.overdue ? " · Overdue" : ""}`}
            {wo.overdue && (
              <span style={{
                marginLeft: 4, fontSize: 10, fontWeight: 600,
                background: "#FEF2F2", color: "#B91C1C",
                border: "1px solid #FECACA",
                padding: "1px 6px", borderRadius: 99,
              }}>
                Overdue
              </span>
            )}
          </p>
        </div>

        {/* Right: action buttons */}
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button style={btnStyle}><MessageSquare size={13} /> Comments</button>
          <button style={btnStyle}><Edit3 size={13} /> Edit</button>
          <button style={{ ...btnStyle, padding: "6px 8px" }}><MoreHorizontal size={14} /></button>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "22px 24px" }}>

        {/* Status buttons */}
        <SectionLabel>Status</SectionLabel>
        <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
          {STATUS_ORDER.map((s) => {
            const cfg = STATUS_CONFIG[s];
            const isActive = wo.status === s;
            return (
              <button
                key={s}
                onClick={() => onStatusChange(wo.id, s)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "7px 15px",
                  borderRadius: 8,
                  border: `1.5px solid ${isActive ? cfg.border : "#E5E7EB"}`,
                  background: isActive ? cfg.bg : "#FAFAFA",
                  color: isActive ? cfg.text : "#6B7280",
                  fontSize: 12, fontWeight: isActive ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.12s",
                  // ✅ subtle scale on active so you can see it's selected
                  boxShadow: isActive ? `0 0 0 3px ${cfg.border}40` : "none",
                }}
              >
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: isActive ? cfg.dot ?? cfg.text : "#D1D5DB",
                  display: "inline-block", flexShrink: 0,
                }} />
                {cfg.label}
              </button>
            );
          })}

          <button style={{
            marginLeft: "auto",
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "7px 14px", borderRadius: 8,
            border: "1.5px solid #E5E7EB", background: "#FAFAFA",
            color: "#2563EB", fontSize: 12, fontWeight: 500, cursor: "pointer",
          }}>
            <Share2 size={13} /> Share report
          </button>
        </div>

        {/* Meta grid */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          border: "1px solid #E5E7EB", borderRadius: 10,
          overflow: "hidden", marginBottom: 24,
        }}>
          <MetaCell icon={<Calendar size={13} color="#9CA3AF" />} label="Due date" value={wo.dueDate} />
          <MetaCell
            label="Priority"
            icon={<i className="ti ti-flag" style={{ fontSize: 13, color: "#9CA3AF" }} aria-hidden="true" />}
            value={
              <span style={{
                fontSize: 12, fontWeight: 600,
                background: priority.bg, color: priority.text,
                border: `1px solid ${priority.border}`,
                padding: "2px 9px", borderRadius: 99,
              }}>
                {priority.label}
              </span>
            }
          />
          <MetaCell
            label="Work order ID"
            icon={<Hash size={13} color="#9CA3AF" />}
            value={<span style={{ fontFamily: "monospace" }}>{wo.id}</span>}
            noBorderRight
          />
        </div>

        {/* Assignees */}
        <FieldGroup label="Assigned to">
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {wo.assignees.length === 0
              ? <span style={{ fontSize: 13, color: "#9CA3AF" }}>No assignees</span>
              : wo.assignees.map((a, i) => {
                  const av = AVATAR_COLORS[a.color];
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: av?.bg ?? "#E0E7FF", color: av?.text ?? "#3730A3",
                        fontSize: 10, fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {a.initials}
                      </div>
                      <span style={{ fontSize: 13, color: "#374151" }}>{a.name}</span>
                    </div>
                  );
                })
            }
          </div>
        </FieldGroup>

        <Divider />

        {/* Asset + Location */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <FieldGroup label="Asset">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151" }}>
              <i className="ti ti-building-factory-2" style={{ fontSize: 14, color: "#9CA3AF" }} aria-hidden="true" />
              {wo.asset}
            </span>
          </FieldGroup>
          <FieldGroup label="Location">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151" }}>
              <MapPin size={13} color="#9CA3AF" />
              {wo.location}
            </span>
          </FieldGroup>
        </div>

        <Divider />

        {/* Description — ✅ now plain text, no raw HTML */}
        <FieldGroup label="Description">
          <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>
            {wo.description}
          </p>
        </FieldGroup>

        <Divider />

        {/* Checklist */}
        {wo.checklist.length > 0 && (
          <>
            <FieldGroup label={`Checklist · ${checkedCount}/${wo.checklist.length}`}>
              <div style={{ height: 4, borderRadius: 99, background: "#E5E7EB", marginBottom: 10, overflow: "hidden" }}>
                <div style={{
                  width: `${checklistPct}%`, height: "100%", borderRadius: 99,
                  background: checklistPct === 100 ? "#22C55E" : "#2563EB",
                  transition: "width 0.3s ease",
                }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {wo.checklist.map((item, i) => (
                  <label key={i} style={{
                    display: "flex", alignItems: "center", gap: 9,
                    fontSize: 13, color: item.done ? "#9CA3AF" : "#374151",
                    cursor: "pointer", textDecoration: item.done ? "line-through" : "none",
                  }}>
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => onChecklistToggle(wo.id, i)}
                      style={{ width: 15, height: 15, accentColor: "#2563EB", cursor: "pointer", flexShrink: 0 }}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </FieldGroup>
            <Divider />
          </>
        )}

        {/* Internal notes */}
        <FieldGroup label="Internal notes">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note for the team…"
            rows={3}
            style={{
              width: "100%", boxSizing: "border-box",
              fontSize: 13, resize: "vertical",
              padding: "9px 11px", borderRadius: 8,
              border: "1px solid #E5E7EB",
              background: "#FAFAFA", color: "#374151",
              outline: "none", fontFamily: "inherit", lineHeight: 1.5,
            }}
          />
        </FieldGroup>

      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 10, fontWeight: 600, letterSpacing: "0.07em",
      textTransform: "uppercase", color: "#9CA3AF", margin: "0 0 10px",
    }}>
      {children}
    </p>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{ fontSize: 11, color: "#9CA3AF", margin: "0 0 6px", fontWeight: 500 }}>{label}</p>
      {children}
    </div>
  );
}

function MetaCell({ label, icon, value, noBorderRight = false }: {
  label: string; icon?: React.ReactNode; value: React.ReactNode; noBorderRight?: boolean;
}) {
  return (
    <div style={{ padding: "12px 14px", borderRight: noBorderRight ? "none" : "1px solid #E5E7EB" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#9CA3AF", marginBottom: 5 }}>
        {icon}{label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{value}</div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "#F3F4F6", margin: "4px 0 18px" }} />;
}

const btnStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "6px 12px", fontSize: 12, fontWeight: 500,
  color: "#374151", background: "#fff",
  border: "1px solid #E5E7EB", borderRadius: 7, cursor: "pointer",
};