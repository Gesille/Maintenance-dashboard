"use client";

import { useState } from "react";
import { MessageSquare, Edit3, MoreHorizontal, Share2, MapPin, Calendar, Hash, ChevronRight } from "lucide-react";
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
  const checklistPct =
    wo.checklist.length > 0 ? Math.round((checkedCount / wo.checklist.length) * 100) : 0;

  const priority = PRIORITY_CONFIG[wo.priority];
  const category = CATEGORY_COLORS[wo.category] ?? CATEGORY_COLORS["General"];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#fff" }}>

      {/* ── Header ── */}
      <div
        style={{
          padding: "16px 28px",
          borderBottom: "1px solid #E2E8F0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          background: "#fff",
        }}
      >
        {/* Breadcrumb + title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: "#94A3B8" }}>Work Orders</span>
            <ChevronRight size={12} color="#CBD5E1" />
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                background: category.bg,
                color: category.text,
                padding: "2px 8px",
                borderRadius: 99,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {wo.category}
            </span>
            <span style={{ fontSize: 11, color: "#CBD5E1", fontFamily: "monospace" }}>{wo.id}</span>
          </div>

          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#0F172A",
              margin: 0,
              letterSpacing: "-0.02em",
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {wo.title}
          </h2>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <ActionBtn icon={<MessageSquare size={13} />} label="Comments" />
          <ActionBtn icon={<Edit3 size={13} />} label="Edit" />
          <ActionBtn icon={<MoreHorizontal size={14} />} />
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>

        {/* Status + due row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
            {STATUS_ORDER.map((s) => {
              const cfg = STATUS_CONFIG[s];
              const isActive = wo.status === s;
              return (
                <button
                  key={s}
                  onClick={() => onStatusChange(wo.id, s)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 14px",
                    borderRadius: 99,
                    border: `1.5px solid ${isActive ? cfg.border : "#E2E8F0"}`,
                    background: isActive ? cfg.bg : "transparent",
                    color: isActive ? cfg.text : "#94A3B8",
                    fontSize: 12,
                    fontWeight: isActive ? 600 : 400,
                    cursor: "pointer",
                    transition: "all 0.12s",
                    letterSpacing: "-0.01em",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: isActive ? cfg.dot ?? cfg.text : "#CBD5E1",
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
                  {cfg.label}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {wo.overdue && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  background: "#FEF2F2",
                  color: "#B91C1C",
                  border: "1px solid #FECACA",
                  padding: "3px 9px",
                  borderRadius: 99,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <i className="ti ti-clock" style={{ fontSize: 11 }} aria-hidden="true" /> Overdue
              </span>
            )}
            <button
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid #E2E8F0",
                background: "#F8FAFC",
                color: "#3B82F6",
                fontSize: 11,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <Share2 size={12} /> Share report
            </button>
          </div>
        </div>

        {/* Meta cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 10,
            marginBottom: 28,
          }}
        >
          <MetaCard
            icon={<Calendar size={14} color="#64748B" />}
            label="Due date"
            value={wo.dueDate}
          />
          <MetaCard
            icon={<i className="ti ti-flag" style={{ fontSize: 14, color: "#64748B" }} aria-hidden="true" />}
            label="Priority"
            value={
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  background: priority.bg,
                  color: priority.text,
                  border: `1px solid ${priority.border}`,
                  padding: "2px 9px",
                  borderRadius: 99,
                }}
              >
                {priority.label}
              </span>
            }
          />
          <MetaCard
            icon={<i className="ti ti-building-factory-2" style={{ fontSize: 14, color: "#64748B" }} aria-hidden="true" />}
            label="Asset"
            value={wo.asset}
          />
          <MetaCard
            icon={<MapPin size={14} color="#64748B" />}
            label="Location"
            value={wo.location}
          />
        </div>

        {/* Assignees */}
        <Section label="Assigned to">
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {wo.assignees.length === 0 ? (
              <span style={{ fontSize: 13, color: "#94A3B8" }}>No assignees</span>
            ) : (
              wo.assignees.map((a, i) => {
                const av = AVATAR_COLORS[a.color];
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: 99,
                      padding: "4px 10px 4px 5px",
                    }}
                  >
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: av?.bg ?? "#E0E7FF",
                        color: av?.text ?? "#3730A3",
                        fontSize: 9,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {a.initials}
                    </div>
                    <span style={{ fontSize: 12, color: "#334155", fontWeight: 500 }}>{a.name}</span>
                  </div>
                );
              })
            )}
            <button
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: "1.5px dashed #CBD5E1",
                background: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#94A3B8",
                fontSize: 16,
              }}
            >
              +
            </button>
          </div>
        </Section>

        <Divider />

        {/* Description */}
        <Section label="Description">
          <p
            style={{
              fontSize: 13,
              color: "#475569",
              lineHeight: 1.75,
              margin: 0,
              whiteSpace: "pre-wrap",
            }}
          >
            {wo.description}
          </p>
        </Section>

        <Divider />

        {/* Checklist */}
        {wo.checklist.length > 0 && (
          <>
            <Section label={`Checklist — ${checkedCount} of ${wo.checklist.length} done`}>
              {/* Progress bar */}
              <div
                style={{
                  height: 3,
                  borderRadius: 99,
                  background: "#E2E8F0",
                  marginBottom: 14,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${checklistPct}%`,
                    height: "100%",
                    borderRadius: 99,
                    background: checklistPct === 100 ? "#22C55E" : "#3B82F6",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {wo.checklist.map((item, i) => (
                  <label
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: 13,
                      color: item.done ? "#94A3B8" : "#334155",
                      cursor: "pointer",
                      textDecoration: item.done ? "line-through" : "none",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => onChecklistToggle(wo.id, i)}
                      style={{
                        width: 15,
                        height: 15,
                        accentColor: "#3B82F6",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </Section>
            <Divider />
          </>
        )}

        {/* Internal notes */}
        <Section label="Internal notes">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note visible to your team…"
            rows={4}
            style={{
              width: "100%",
              boxSizing: "border-box",
              fontSize: 13,
              resize: "vertical",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #E2E8F0",
              background: "#F8FAFC",
              color: "#334155",
              outline: "none",
              fontFamily: "inherit",
              lineHeight: 1.6,
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#3B82F6")}
            onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")}
          />
          {note.trim() && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <button
                style={{
                  padding: "6px 14px",
                  background: "#0F172A",
                  color: "#fff",
                  border: "none",
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  letterSpacing: "-0.01em",
                }}
              >
                Save note
              </button>
            </div>
          )}
        </Section>

      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#94A3B8",
          margin: "0 0 10px",
        }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}

function MetaCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#F8FAFC",
        border: "1px solid #E2E8F0",
        borderRadius: 10,
        padding: "12px 14px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          fontSize: 10,
          color: "#94A3B8",
          marginBottom: 7,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontWeight: 600,
        }}
      >
        {icon} {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, color: "#0F172A" }}>{value}</div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "#F1F5F9", margin: "6px 0 20px" }} />;
}

function ActionBtn({ icon, label }: { icon: React.ReactNode; label?: string }) {
  return (
    <button
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: label ? 6 : 0,
        padding: label ? "6px 12px" : "6px 8px",
        fontSize: 12,
        fontWeight: 500,
        color: "#475569",
        background: "#fff",
        border: "1px solid #E2E8F0",
        borderRadius: 8,
        cursor: "pointer",
        transition: "all 0.12s",
      }}
    >
      {icon}
      {label}
    </button>
  );
}