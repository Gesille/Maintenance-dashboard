/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import {
  Search, RefreshCw, X, Loader, Ticket as TicketIcon, AlertCircle, ChevronRight,
} from "lucide-react";
import {
  TicketStatus,
  TicketCategory,
  useGetAllTicketsQuery,
  SupportTicket,
  useUpdateTicketMutation,
} from "@/redux/Supportticket/Supportticketapi";
import { TICKET_STATUS_CONFIG, TICKET_CATEGORY_CONFIG } from "@/types/tokens";
import { WorkOrderSidebar } from "@/component/Sidebar";

const STATUS_ORDER: TicketStatus[] = ["open", "in_progress", "resolved", "closed"];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

function shortId(id: string) {
  return `TKT-${id.slice(-6).toUpperCase()}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Small building blocks (same visual language as UsersPage)
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: TicketStatus }) {
  const c = TICKET_STATUS_CONFIG[status];
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        borderRadius: 999, border: `1.5px solid ${c.border}`,
        padding: "5px 10px", fontSize: 12, fontWeight: 600,
        background: c.bg, color: c.text, textTransform: "capitalize",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot }} />
      {c.label}
    </span>
  );
}

function CategoryBadge({ category }: { category: TicketCategory }) {
  const c = TICKET_CATEGORY_CONFIG[category];
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        borderRadius: 8, padding: "5px 10px", fontSize: 12, fontWeight: 600,
        background: c.bg, color: c.text,
      }}
    >
      <i className={`ti ${c.icon}`} style={{ fontSize: 14 }} />
      {c.label}
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <div
      style={{
        width: 32, height: 32, borderRadius: "50%",
        background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
        color: "#fff", fontSize: 11, fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}
    >
      {initials(name) || "?"}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page — rendered next to the sidebar
// ─────────────────────────────────────────────────────────────────────────────
export default function SupportTicketsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | "all">("all");
  const [selected, setSelected] = useState<SupportTicket | null>(null);

  // Status filtering happens server-side (the controller already supports
  // req.query.status). Category has no backend filter yet, so that stays
  // client-side below — see suggestion #4 note at the bottom of this file.
  const {
    data: tickets = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetAllTicketsQuery(statusFilter !== "all" ? { status: statusFilter } : undefined);

  // Counts for the stat cards need the *unfiltered* set, so fetch that too.
  // RTK Query dedupes/caches this against the same endpoint+args automatically.
  const { data: allTickets = [] } = useGetAllTicketsQuery(undefined);

  const counts = useMemo(() => {
    const base: Record<TicketStatus | "all", number> = {
      all: allTickets.length,
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
    };
    for (const t of allTickets) base[t.status]++;
    return base;
  }, [allTickets]);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const haystack = `${t.subject} ${t.userName} ${t.userEmail} ${t.message}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [tickets, categoryFilter, search]);

  // Keep the open drawer in sync with fresh data after a mutation refetches the list
  const selectedLive = selected ? tickets.find((t) => t.id === selected.id) ?? selected : null;

  if (isLoading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#F8FAFF" }}>
        <span style={{ fontSize: 13, color: "#94A3B8" }}>Loading tickets…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", alignItems: "center", justifyContent: "center", background: "#FFF5F5", gap: 12 }}>
        <span style={{ fontSize: 13, color: "#DC2626" }}>
          {(error as any)?.data?.message || "Failed to load tickets."}
        </span>
        <button
          onClick={() => refetch()}
          style={{ padding: "8px 18px", background: "linear-gradient(135deg, #6366F1, #8B5CF6)", color: "#fff", border: "none", borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#F8FAFF" }}>
      <WorkOrderSidebar />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 60%, #FAF5FF 100%)",
            borderBottom: "2px solid #6366F122",
            padding: "24px 32px",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, marginBottom: 18 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: "0 0 4px", letterSpacing: "-0.03em" }}>
                Support Tickets
              </h1>
              <span style={{ fontSize: 12, color: "#64748B" }}>
                {counts.all} ticket{counts.all !== 1 ? "s" : ""} total
              </span>
            </div>

            <button
              onClick={() => refetch()}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "9px 16px", fontSize: 12, fontWeight: 600, color: "#374151",
                background: "#fff", border: "1.5px solid #E0E7FF", borderRadius: 10, cursor: "pointer",
              }}
            >
              <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {/* Status filter chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            <StatChip
              label="All"
              value={counts.all}
              active={statusFilter === "all"}
              onClick={() => setStatusFilter("all")}
            />
            {STATUS_ORDER.map((s) => (
              <StatChip
                key={s}
                label={TICKET_STATUS_CONFIG[s].label}
                value={counts[s]}
                dotColor={TICKET_STATUS_CONFIG[s].dot}
                active={statusFilter === s}
                onClick={() => setStatusFilter(s)}
              />
            ))}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <div
              style={{
                display: "flex", alignItems: "center", gap: 8, background: "#fff",
                borderRadius: 10, padding: "0 12px", height: 36,
                border: "1.5px solid #E0E7FF", maxWidth: 360, flex: 1, minWidth: 220,
              }}
            >
              <Search size={13} color="#A5B4FC" strokeWidth={2} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by subject, name, or email…"
                style={{ border: "none", background: "transparent", fontSize: 12, color: "#0F172A", outline: "none", width: "100%" }}
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as TicketCategory | "all")}
              style={{
                border: "1.5px solid #E0E7FF", background: "#fff", borderRadius: 10,
                height: 36, padding: "0 10px", fontSize: 12, fontWeight: 600, color: "#374151", outline: "none",
              }}
            >
              <option value="all">All categories</option>
              {(Object.keys(TICKET_CATEGORY_CONFIG) as TicketCategory[]).map((c) => (
                <option key={c} value={c}>{TICKET_CATEGORY_CONFIG[c].label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 20px", color: "#94A3B8", fontSize: 13 }}>
              <TicketIcon size={22} style={{ marginBottom: 8 }} />
              <div>No tickets match these filters</div>
            </div>
          ) : (
            <div style={{ background: "#fff", border: "1px solid #E8EAFF", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(99,102,241,0.06)" }}>
              {/* Header row */}
              <div style={{ display: "grid", gridTemplateColumns: "0.9fr 2fr 1.1fr 1.6fr 1.1fr 0.9fr 0.4fr", padding: "12px 20px", background: "#FAFBFF", borderBottom: "1px solid #E8EAFF" }}>
                {["Ticket", "Requester", "Category", "Subject", "Status", "Created", ""].map((h, i) => (
                  <span key={i} style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94A3B8" }}>
                    {h}
                  </span>
                ))}
              </div>

              {filtered.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelected(t)}
                  style={{
                    display: "grid", gridTemplateColumns: "0.9fr 2fr 1.1fr 1.6fr 1.1fr 0.9fr 0.4fr",
                    alignItems: "center", padding: "14px 20px",
                    borderBottom: "1px solid #F0F4FF", cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFBFF")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ fontSize: 11, color: "#94A3B8", fontFamily: "monospace" }}>{shortId(t.id)}</span>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <Avatar name={t.userName} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {t.userName}
                      </p>
                      <p style={{ fontSize: 11, color: "#94A3B8", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {t.userEmail}
                      </p>
                    </div>
                  </div>

                  <div><CategoryBadge category={t.category} /></div>

                  <span style={{ fontSize: 13, color: "#334155", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {t.subject}
                  </span>

                  <div><StatusBadge status={t.status} /></div>

                  <span style={{ fontSize: 12, color: "#64748B" }}>{timeAgo(t.createdAt)}</span>

                  <div style={{ textAlign: "right" }}>
                    <ChevronRight size={14} color="#CBD5E1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Detail drawer */}
      {selectedLive && <TicketDrawer ticket={selectedLive} onClose={() => setSelected(null)} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .animate-spin { animation: spin 0.7s linear infinite; }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat chip (replaces the old grid of StatCards with the Users-page chip style)
// ─────────────────────────────────────────────────────────────────────────────
function StatChip({
  label,
  value,
  dotColor,
  active,
  onClick,
}: {
  label: string;
  value: number;
  dotColor?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 7,
        padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600,
        border: active ? "1.5px solid #C7D2FE" : "1.5px solid #E5E7EB",
        background: active ? "#EEF2FF" : "#fff",
        color: active ? "#4338CA" : "#64748B",
        cursor: "pointer",
      }}
    >
      {dotColor && <span style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor }} />}
      {label}
      <span
        style={{
          fontSize: 11, fontWeight: 700, padding: "1px 6px", borderRadius: 999,
          background: active ? "#C7D2FE55" : "#F1F5F9", color: active ? "#4338CA" : "#94A3B8",
        }}
      >
        {value}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail drawer — view full ticket, change status, send a reply
// ─────────────────────────────────────────────────────────────────────────────
function TicketDrawer({ ticket, onClose }: { ticket: SupportTicket; onClose: () => void }) {
  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [reply, setReply] = useState(ticket.adminReply ?? "");
  const [updateTicket, { isLoading: saving }] = useUpdateTicketMutation();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaveError(null);
    setSaved(false);
    try {
      await updateTicket({
        id: ticket.id,
        status,
        adminReply: reply.trim() || undefined,
      }).unwrap();
      setSaved(true);
    } catch (err: any) {
      setSaveError(err?.data?.message || "Failed to update ticket.");
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", justifyContent: "flex-end" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.4)" }} onClick={onClose} />
      <div style={{ position: "relative", display: "flex", flexDirection: "column", height: "100%", width: "100%", maxWidth: 440, background: "#fff", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid #F0F4FF" }}>
          <div>
            <div style={{ fontSize: 11, color: "#94A3B8", fontFamily: "monospace" }}>{shortId(ticket.id)}</div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: "2px 0 0" }}>{ticket.subject}</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px" }}>
          {/* Requester */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Avatar name={ticket.userName} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{ticket.userName}</div>
              <div style={{ fontSize: 11, color: "#94A3B8" }}>{ticket.userEmail}</div>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            <CategoryBadge category={ticket.category} />
            <StatusBadge status={ticket.status} />
          </div>

          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94A3B8", marginBottom: 6 }}>
            Message
          </div>
          <div style={{ marginBottom: 16, whiteSpace: "pre-wrap", borderRadius: 10, border: "1px solid #F0F4FF", background: "#FAFBFF", padding: 12, fontSize: 13, color: "#334155" }}>
            {ticket.message}
          </div>

          <div style={{ marginBottom: 16, fontSize: 11, color: "#94A3B8" }}>
            Submitted {new Date(ticket.createdAt).toLocaleString()}
            {ticket.repliedAt && <> · replied {new Date(ticket.repliedAt).toLocaleString()}</>}
          </div>

          {/* Status control */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94A3B8", marginBottom: 8 }}>
              Status
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {STATUS_ORDER.map((s) => {
                const c = TICKET_STATUS_CONFIG[s];
                const isActive = status === s;
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      borderRadius: 999, padding: "6px 12px", fontSize: 12, fontWeight: 600,
                      border: `1.5px solid ${isActive ? c.border : "#E5E7EB"}`,
                      background: isActive ? c.bg : "#fff",
                      color: isActive ? c.text : "#94A3B8",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot }} />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reply */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94A3B8", marginBottom: 8 }}>
              Admin reply
            </label>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={5}
              placeholder="Write a reply to the requester…"
              style={{
                width: "100%", boxSizing: "border-box", padding: "9px 12px", fontSize: 13,
                color: "#0F172A", background: "#FAFBFF", border: "1.5px solid #E8EAFF",
                borderRadius: 9, outline: "none", fontFamily: "inherit", resize: "vertical",
              }}
            />
          </div>

          {saveError && (
            <p style={{ marginTop: 8, fontSize: 12, color: "#DC2626", display: "flex", alignItems: "center", gap: 6 }}>
              <AlertCircle size={13} /> {saveError}
            </p>
          )}
          {saved && !saveError && <p style={{ marginTop: 8, fontSize: 12, color: "#15803D" }}>Ticket updated.</p>}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "16px 22px", borderTop: "1px solid #F0F4FF" }}>
          <button
            onClick={onClose}
            style={{ padding: "8px 16px", fontSize: 12, fontWeight: 600, background: "#fff", border: "1.5px solid #E8EAFF", borderRadius: 9, color: "#64748B", cursor: "pointer" }}
          >
            Close
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 16px", fontSize: 12, fontWeight: 600, color: "#fff",
              background: saving ? "#A5B4FC" : "linear-gradient(135deg, #6366F1, #8B5CF6)",
              border: "none", borderRadius: 9, cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving && <Loader size={12} style={{ animation: "spin 0.7s linear infinite" }} />}
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
On the 4 suggestions from before:

1) DONE — TICKET_STATUS_CONFIG / TICKET_CATEGORY_CONFIG now live in
   types/tokens.ts next to STATUS_CONFIG / CATEGORY_COLORS.

2) DONE — WorkOrderSidebar.tsx now queries getAllTickets and shows a live
   open+in_progress count on the Support Tickets nav item.

3) Email-on-reply: see the updated support_ticket.controller.ts — updateTicket
   now sends the requester an email the first time adminReply is set.

4) PARTIAL — status filtering now happens server-side via the status query
   param your controller already supports (getAllTicketsQuery re-fetches with
   {status} instead of filtering client-side). Category filtering is still
   client-side because getAllTickets has no category param yet; add
   `const { category } = req.query;` to the filter object in getAllTickets
   alongside `status` if you want that server-side too — it's a one-line
   change on the backend, then swap `categoryFilter` into the query args here
   the same way `statusFilter` is used.

DESIGN NOTE (this pass): rebuilt the page to match UsersPage.tsx's visual
language — same gradient header, inline-style cards, indigo/violet accent
palette, and stat "chips" instead of the old Tailwind stat-card grid. The
Tailwind classes and `ti ti-*` icon classes for category icons were kept
only where the token config still references them (CategoryBadge); the rest
of the layout is now inline styles like UsersPage, and lucide-react icons
replace the ti-* utility icons in the chrome (search, close, refresh, etc).
───────────────────────────────────────────────────────────────────────────── */