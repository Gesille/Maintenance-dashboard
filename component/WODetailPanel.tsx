"use client";

import { useState } from "react";
import {
  MessageSquare, Edit3, MoreHorizontal, Share2,
  MapPin, Calendar, ChevronRight, Send, Loader,
} from "lucide-react";
import { PRIORITY_CONFIG, CATEGORY_COLORS, STATUS_CONFIG, AVATAR_COLORS } from "@/types/tokens";
import { WorkOrder, WOStatus } from "@/types/types";
import {
  useGetMaintenanceMessagesQuery,
  usePostMaintenanceCommentMutation,
} from "@/redux/Maintenance/Maintenanceapi";

interface WODetailProps {
  wo: WorkOrder;
  onStatusChange: (id: string, status: WOStatus) => void;
  onChecklistToggle: (id: string, index: number) => void;
  updatingId: string | null;
}

const STATUS_ORDER: WOStatus[] = ["open", "in_progress", "on_hold", "done"];

export function WODetailPanel({ wo, onStatusChange, onChecklistToggle, updatingId }: WODetailProps) {
  const [tab, setTab] = useState<"details" | "comments">("details");
  const [note, setNote] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);

  const checkedCount = wo.checklist.filter((c) => c.done).length;
  const checklistPct = wo.checklist.length > 0
    ? Math.round((checkedCount / wo.checklist.length) * 100) : 0;

  const priority = PRIORITY_CONFIG[wo.priority];
  const category = CATEGORY_COLORS[wo.category] ?? CATEGORY_COLORS["General"];
  const isUpdating = updatingId === wo.id;

const { data: messages = [], isLoading: msgLoading } =
  useGetMaintenanceMessagesQuery(
    wo.numericId,
    {
      skip: !wo.numericId
    }
  );
  const [postComment, { isLoading: posting }] = usePostMaintenanceCommentMutation();

  const handleSendComment = async () => {
    if (!commentBody.trim()) return;
    try {
      await postComment({
        id: wo.numericId,
        body: commentBody.trim(),
        authorName: "Manager",
        isInternal,
      }).unwrap();
      setCommentBody("");
    } catch (err) {
      console.error("Failed to post comment:", err);
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#fff" }}>

      {/* ── Header ── */}
      <div style={{
        padding: "16px 28px",
        borderBottom: "1px solid #E2E8F0",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: "#94A3B8" }}>Work Orders</span>
            <ChevronRight size={12} color="#CBD5E1" />
            <span style={{
              fontSize: 10, fontWeight: 600,
              background: category.bg, color: category.text,
              padding: "2px 8px", borderRadius: 99,
              textTransform: "uppercase", letterSpacing: "0.06em",
            }}>
              {wo.categoryLabel}
            </span>
            <span style={{ fontSize: 11, color: "#CBD5E1", fontFamily: "monospace" }}>{wo.id}</span>
          </div>
          <h2 style={{
            fontSize: 18, fontWeight: 600, color: "#0F172A", margin: 0,
            letterSpacing: "-0.02em", lineHeight: 1.3,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {wo.title}
          </h2>
          <p style={{ fontSize: 11, color: "#94A3B8", margin: "4px 0 0", display: "flex", alignItems: "center", gap: 6 }}>
            <Calendar size={11} />
            Created {wo.createDate}
            {wo.maintenanceTeam !== "—" && (
              <><span style={{ color: "#CBD5E1" }}>·</span> {wo.maintenanceTeam}</>
            )}
            {wo.isRecurring && (
              <span style={{
                fontSize: 10, fontWeight: 500,
                background: "#F0FDF4", color: "#166534",
                border: "1px solid #BBF7D0",
                padding: "1px 7px", borderRadius: 99,
              }}>Recurring</span>
            )}
          </p>
        </div>

        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <ActionBtn
            icon={<MessageSquare size={13} />}
            label={`Comments${messages.length ? ` (${messages.length})` : ""}`}
            onClick={() => setTab("comments")}
            active={tab === "comments"}
          />
          <ActionBtn icon={<Edit3 size={13} />} label="Edit" />
          <ActionBtn icon={<MoreHorizontal size={14} />} />
        </div>
      </div>

      {/* ── Status bar ── */}
      <div style={{
        padding: "12px 28px",
        borderBottom: "1px solid #F1F5F9",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
      }}>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
          {STATUS_ORDER.map((s) => {
            const cfg = STATUS_CONFIG[s];
            const isActive = wo.status === s;
            return (
              <button
                key={s}
                onClick={() => !isUpdating && onStatusChange(wo.id, s)}
                disabled={isUpdating}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "6px 14px", borderRadius: 99,
                  border: `1.5px solid ${isActive ? cfg.border : "#E2E8F0"}`,
                  background: isActive ? cfg.bg : "transparent",
                  color: isActive ? cfg.text : "#94A3B8",
                  fontSize: 12, fontWeight: isActive ? 600 : 400,
                  cursor: isUpdating ? "not-allowed" : "pointer",
                  opacity: isUpdating && !isActive ? 0.5 : 1,
                  transition: "all 0.12s",
                }}
              >
                {isUpdating && isActive
                  ? <Loader size={10} style={{ animation: "spin 0.7s linear infinite" }} />
                  : <span style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: isActive ? cfg.dot ?? cfg.text : "#CBD5E1",
                      display: "inline-block", flexShrink: 0,
                    }} />
                }
                {cfg.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {wo.overdue && (
            <span style={{
              fontSize: 11, fontWeight: 600,
              background: "#FEF2F2", color: "#B91C1C",
              border: "1px solid #FECACA", padding: "3px 9px", borderRadius: 99,
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <i className="ti ti-clock" style={{ fontSize: 11 }} aria-hidden="true" /> Overdue
            </span>
          )}
          <button style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "6px 12px", borderRadius: 8,
            border: "1px solid #E2E8F0", background: "#F8FAFC",
            color: "#6366F1", fontSize: 11, fontWeight: 500, cursor: "pointer",
          }}>
            <Share2 size={12} /> Share
          </button>
        </div>
      </div>

      {/* ── Tab switcher ── */}
      <div style={{ display: "flex", borderBottom: "1px solid #E2E8F0", paddingLeft: 28 }}>
        {(["details", "comments"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "10px 16px", fontSize: 12,
            fontWeight: tab === t ? 600 : 400,
            color: tab === t ? "#6366F1" : "#94A3B8",
            background: "none", border: "none",
            borderBottom: `2px solid ${tab === t ? "#6366F1" : "transparent"}`,
            cursor: "pointer", marginBottom: -1, textTransform: "capitalize",
          }}>
            {t === "comments" && messages.length > 0 ? `Comments (${messages.length})` : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>

        {tab === "details" && (
          <>
            {/* Meta grid — 4 cols */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }}>
              <MetaCard icon={<Calendar size={14} color="#64748B" />} label="Due date" value={wo.dueDate} />
              <MetaCard
                icon={<i className="ti ti-flag" style={{ fontSize: 14, color: "#64748B" }} aria-hidden="true" />}
                label="Priority"
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
              <MetaCard
                icon={<i className="ti ti-clock" style={{ fontSize: 14, color: "#64748B" }} aria-hidden="true" />}
                label="Duration"
                value={`${wo.duration}h`}
              />
              <MetaCard
                icon={<i className="ti ti-calendar-event" style={{ fontSize: 14, color: "#64748B" }} aria-hidden="true" />}
                label="Ends"
                value={wo.scheduleEnd}
              />
            </div>

            {/* Equipment section */}
            <Section label="Equipment">
              <div style={{
                background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, overflow: "hidden",
              }}>
                <EquipRow icon="ti-tool" label="Asset" value={wo.asset} />
                <EquipRow icon="ti-map-pin" label="Location" value={wo.location} divider />
                <EquipRow icon="ti-category" label="Category" value={wo.categoryLabel} divider />
                {wo.maintenanceType !== "—" && (
                  <EquipRow icon="ti-settings" label="Type" value={wo.maintenanceType} divider />
                )}
                {wo.assetCode && <EquipRow icon="ti-barcode" label="Asset code" value={wo.assetCode} divider />}
                {wo.model && <EquipRow icon="ti-versions" label="Model" value={wo.model} divider />}
                {wo.serialNo && <EquipRow icon="ti-hash" label="Serial no." value={wo.serialNo} divider />}
              </div>
            </Section>

            <Divider />

            {/* Assignees */}
            <Section label="Assigned technicians">
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {wo.assignees.length === 0 ? (
                  <span style={{ fontSize: 13, color: "#94A3B8" }}>No assignees</span>
                ) : (
                  wo.assignees.map((a, i) => {
                    const av = AVATAR_COLORS[a.color];
                    return (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", gap: 7,
                        background: "#F8FAFC", border: "1px solid #E2E8F0",
                        borderRadius: 99, padding: "4px 10px 4px 5px",
                      }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: "50%",
                          background: av?.bg ?? "#E0E7FF", color: av?.text ?? "#3730A3",
                          fontSize: 9, fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          {a.initials}
                        </div>
                        <span style={{ fontSize: 12, color: "#334155", fontWeight: 500 }}>{a.name}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </Section>

            <Divider />

            {/* Description */}
            <Section label="Description">
              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.75, margin: 0, whiteSpace: "pre-wrap" }}>
                {wo.description}
              </p>
            </Section>

            {/* Checklist */}
            {wo.checklist.length > 0 && (
              <>
                <Divider />
                <Section label={`Checklist — ${checkedCount} of ${wo.checklist.length} done`}>
                  <div style={{ height: 3, borderRadius: 99, background: "#E2E8F0", marginBottom: 14, overflow: "hidden" }}>
                    <div style={{
                      width: `${checklistPct}%`, height: "100%", borderRadius: 99,
                      background: checklistPct === 100 ? "#22C55E" : "#6366F1",
                      transition: "width 0.3s ease",
                    }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                    {wo.checklist.map((item, i) => (
                      <label key={i} style={{
                        display: "flex", alignItems: "center", gap: 10,
                        fontSize: 13, color: item.done ? "#94A3B8" : "#334155",
                        cursor: "pointer", textDecoration: item.done ? "line-through" : "none",
                      }}>
                        <input
                          type="checkbox" checked={item.done}
                          onChange={() => onChecklistToggle(wo.id, i)}
                          style={{ width: 15, height: 15, accentColor: "#6366F1", cursor: "pointer", flexShrink: 0 }}
                        />
                        {item.label}
                      </label>
                    ))}
                  </div>
                </Section>
              </>
            )}

            <Divider />

            {/* Internal notes */}
            <Section label="Internal notes">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note visible to your team…"
                rows={3}
                style={{
                  width: "100%", boxSizing: "border-box", fontSize: 13, resize: "vertical",
                  padding: "10px 12px", borderRadius: 10,
                  border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#334155",
                  outline: "none", fontFamily: "inherit", lineHeight: 1.6, transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#6366F1")}
                onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")}
              />
              {note.trim() && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                  <button style={{
                    padding: "6px 14px", background: "#6366F1", color: "#fff",
                    border: "none", borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: "pointer",
                  }}>
                    Save note
                  </button>
                </div>
              )}
            </Section>
          </>
        )}

        {tab === "comments" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {msgLoading ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8", fontSize: 13 }}>
                Loading messages…
              </div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <i className="ti ti-message-circle-off" style={{ fontSize: 32, color: "#CBD5E1", display: "block", marginBottom: 8 }} />
                <p style={{ fontSize: 13, color: "#94A3B8", margin: 0 }}>No comments yet</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} style={{
                  padding: "14px 0",
                  borderBottom: "1px solid #F1F5F9",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: "50%",
                      background: msg.isInternal ? "#FEF3C7" : "#EDE9FE",
                      color: msg.isInternal ? "#92400E" : "#5B21B6",
                      fontSize: 9, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      {(msg.author?.name ?? "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                      {msg.author?.name ?? "Unknown"}
                    </span>
                    {msg.isInternal && (
                      <span style={{
                        fontSize: 10, fontWeight: 500,
                        background: "#FEF3C7", color: "#92400E",
                        border: "1px solid #FDE68A",
                        padding: "1px 6px", borderRadius: 99,
                      }}>Internal</span>
                    )}
                    <span style={{ fontSize: 11, color: "#94A3B8", marginLeft: "auto" }}>
                      {new Date(msg.date).toLocaleString("en-US", {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p style={{
                    fontSize: 13, color: "#475569", lineHeight: 1.65, margin: 0,
                    paddingLeft: 34,
                  }}
                    dangerouslySetInnerHTML={{ __html: msg.body }}
                  />
                </div>
              ))
            )}

            {/* Comment composer */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #F1F5F9" }}>
              <textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Write a comment…"
                rows={3}
                style={{
                  width: "100%", boxSizing: "border-box", fontSize: 13, resize: "none",
                  padding: "10px 12px", borderRadius: 10,
                  border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#334155",
                  outline: "none", fontFamily: "inherit", lineHeight: 1.6, transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#6366F1")}
                onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")}
              />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748B", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    style={{ accentColor: "#6366F1" }}
                  />
                  Internal note
                </label>
                <button
                  onClick={handleSendComment}
                  disabled={posting || !commentBody.trim()}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "7px 14px", background: "#6366F1", color: "#fff",
                    border: "none", borderRadius: 8, fontSize: 12, fontWeight: 500,
                    cursor: posting || !commentBody.trim() ? "not-allowed" : "pointer",
                    opacity: posting || !commentBody.trim() ? 0.6 : 1,
                  }}
                >
                  {posting
                    ? <Loader size={12} style={{ animation: "spin 0.7s linear infinite" }} />
                    : <Send size={12} />
                  }
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{
        fontSize: 10, fontWeight: 600, letterSpacing: "0.08em",
        textTransform: "uppercase", color: "#94A3B8", margin: "0 0 10px",
      }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function MetaCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "12px 14px" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#94A3B8",
        marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600,
      }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, color: "#0F172A" }}>{value}</div>
    </div>
  );
}

function EquipRow({ icon, label, value, divider = false }: {
  icon: string; label: string; value: string; divider?: boolean;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center",
      padding: "10px 14px",
      borderTop: divider ? "1px solid #E2E8F0" : "none",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, width: 130, flexShrink: 0 }}>
        <i className={`ti ${icon}`} style={{ fontSize: 14, color: "#94A3B8" }} aria-hidden="true" />
        <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {label}
        </span>
      </div>
      <span style={{ fontSize: 13, color: "#0F172A", fontWeight: 500 }}>{value || "—"}</span>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "#F1F5F9", margin: "6px 0 20px" }} />;
}

function ActionBtn({ icon, label, onClick, active }: {
  icon: React.ReactNode; label?: string; onClick?: () => void; active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: label ? 6 : 0,
        padding: label ? "6px 12px" : "6px 8px",
        fontSize: 12, fontWeight: 500,
        color: active ? "#6366F1" : "#475569",
        background: active ? "#F5F3FF" : "#fff",
        border: `1px solid ${active ? "#C7D2FE" : "#E2E8F0"}`,
        borderRadius: 8, cursor: "pointer", transition: "all 0.12s",
      }}
    >
      {icon}{label}
    </button>
  );
}