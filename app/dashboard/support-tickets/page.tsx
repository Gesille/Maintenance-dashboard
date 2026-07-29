/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
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
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function shortId(id: string) {
  return `TKT-${id.slice(-6).toUpperCase()}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Small building blocks
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: TicketStatus }) {
  const c = TICKET_STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: c.bg, color: c.text, borderColor: c.border }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c.dot }} />
      {c.label}
    </span>
  );
}

function CategoryBadge({ category }: { category: TicketCategory }) {
  const c = TICKET_CATEGORY_CONFIG[category];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      <i className={`ti ${c.icon} text-sm`} />
      {c.label}
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EDE9FE] text-xs font-semibold text-[#5B21B6]">
      {initials(name)}
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

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <WorkOrderSidebar />

      <div className="min-h-screen flex-1 bg-[#FAFAFA] px-6 py-6 lg:px-10 lg:py-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-[#111827]">Support Tickets</h1>
            <p className="mt-1 text-sm text-[#6B7280]">
              {isLoading ? "Loading…" : `${counts.all} ticket${counts.all === 1 ? "" : "s"} total`}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2 text-sm font-medium text-[#374151] transition hover:bg-[#F9FAFB]"
          >
            <i className={`ti ti-refresh text-base ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Stat cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard
            label="All tickets"
            value={counts.all}
            active={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
          />
          {STATUS_ORDER.map((s) => (
            <StatCard
              key={s}
              label={TICKET_STATUS_CONFIG[s].label}
              value={counts[s]}
              color={TICKET_STATUS_CONFIG[s]}
              active={statusFilter === s}
              onClick={() => setStatusFilter(s)}
            />
          ))}
        </div>

        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by subject, name, or email…"
              className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2 pl-9 pr-3 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-[#93C5FD] focus:ring-2 focus:ring-[#DBEAFE]"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as TicketCategory | "all")}
            className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#374151] outline-none focus:border-[#93C5FD] focus:ring-2 focus:ring-[#DBEAFE]"
          >
            <option value="all">All categories</option>
            {(Object.keys(TICKET_CATEGORY_CONFIG) as TicketCategory[]).map((c) => (
              <option key={c} value={c}>
                {TICKET_CATEGORY_CONFIG[c].label}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
          {isLoading ? (
            <div className="p-10 text-center text-sm text-[#9CA3AF]">Loading tickets…</div>
          ) : isError ? (
            <div className="p-10 text-center text-sm text-[#B91C1C]">
              <i className="ti ti-alert-circle mb-2 block text-2xl" />
              {(error as any)?.data?.message || "Failed to load tickets."}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#9CA3AF]">
              <i className="ti ti-ticket mb-2 block text-2xl" />
              No tickets match these filters.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-xs uppercase tracking-wide text-[#6B7280]">
                  <th className="px-4 py-3 font-medium">Ticket</th>
                  <th className="px-4 py-3 font-medium">Requester</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className="cursor-pointer border-b border-[#F3F4F6] transition last:border-0 hover:bg-[#F9FAFB]"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-[#6B7280]">{shortId(t.id)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={t.userName} />
                        <div>
                          <div className="font-medium text-[#111827]">{t.userName}</div>
                          <div className="text-xs text-[#6B7280]">{t.userEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <CategoryBadge category={t.category} />
                    </td>
                    <td className="max-w-[240px] truncate px-4 py-3 text-[#374151]">{t.subject}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3 text-[#6B7280]">{timeAgo(t.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <i className="ti ti-chevron-right text-[#9CA3AF]" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail drawer */}
        {selectedLive && <TicketDrawer ticket={selectedLive} onClose={() => setSelected(null)} />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat card
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  color,
  active,
  onClick,
}: {
  label: string;
  value: number;
  color?: { bg: string; text: string; border: string; dot: string };
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border p-4 text-left transition"
      style={{
        backgroundColor: active ? (color?.bg ?? "#F3F4F6") : "#FFFFFF",
        borderColor: active ? (color?.border ?? "#D1D5DB") : "#E5E7EB",
      }}
    >
      <div className="flex items-center gap-1.5 text-xs font-medium text-[#6B7280]">
        {color && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color.dot }} />}
        {label}
      </div>
      <div className="mt-1.5 text-xl font-semibold text-[#111827]">{value}</div>
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
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#E5E7EB] px-5 py-4">
          <div>
            <div className="font-mono text-xs text-[#9CA3AF]">{shortId(ticket.id)}</div>
            <h2 className="mt-0.5 text-base font-semibold text-[#111827]">{ticket.subject}</h2>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-[#9CA3AF] hover:bg-[#F3F4F6]">
            <i className="ti ti-x text-lg" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Requester */}
          <div className="mb-4 flex items-center gap-3">
            <Avatar name={ticket.userName} />
            <div>
              <div className="text-sm font-medium text-[#111827]">{ticket.userName}</div>
              <div className="text-xs text-[#6B7280]">{ticket.userEmail}</div>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <CategoryBadge category={ticket.category} />
            <StatusBadge status={ticket.status} />
          </div>

          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-[#9CA3AF]">Message</div>
          <div className="mb-4 whitespace-pre-wrap rounded-lg border border-[#F3F4F6] bg-[#F9FAFB] p-3 text-sm text-[#374151]">
            {ticket.message}
          </div>

          <div className="mb-4 text-xs text-[#9CA3AF]">
            Submitted {new Date(ticket.createdAt).toLocaleString()}
            {ticket.repliedAt && <> · replied {new Date(ticket.repliedAt).toLocaleString()}</>}
          </div>

          {/* Status control */}
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#9CA3AF]">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {STATUS_ORDER.map((s) => {
                const c = TICKET_STATUS_CONFIG[s];
                const isActive = status === s;
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition"
                    style={{
                      backgroundColor: isActive ? c.bg : "#FFFFFF",
                      color: isActive ? c.text : "#9CA3AF",
                      borderColor: isActive ? c.border : "#E5E7EB",
                    }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c.dot }} />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reply */}
          <div className="mb-2">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#9CA3AF]">
              Admin reply
            </label>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={5}
              placeholder="Write a reply to the requester…"
              className="w-full rounded-lg border border-[#E5E7EB] p-3 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-[#93C5FD] focus:ring-2 focus:ring-[#DBEAFE]"
            />
          </div>

          {saveError && <div className="mt-2 text-xs text-[#B91C1C]">{saveError}</div>}
          {saved && !saveError && <div className="mt-2 text-xs text-[#15803D]">Ticket updated.</div>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-[#E5E7EB] px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-[#E5E7EB] px-3.5 py-2 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB]"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-[#111827] px-3.5 py-2 text-sm font-medium text-white transition hover:bg-[#1F2937] disabled:opacity-50"
          >
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
───────────────────────────────────────────────────────────────────────────── */