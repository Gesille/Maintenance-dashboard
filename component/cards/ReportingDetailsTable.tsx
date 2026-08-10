"use client";
import { useMemo, useState } from "react";
import { Search, ArrowUpDown } from "lucide-react";
import { CardShell } from "../shared/CardShell";
import { EmptyState } from "../shared/EmptyState";

import type { RequestDetailRow } from "@/redux/Reporting/Reportingapi";
import { MAINTENANCE_STATUS_CONFIG, PRIORITY_CONFIG } from "@/types/tokens";

type SortKey = "createdAt" | "name" | "status" | "priority";

const PAGE_SIZE = 25;

export function ReportingDetailsTable({ data, isLoading }: { data: RequestDetailRow[]; isLoading: boolean }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = data;
    if (q) {
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.equipmentName.toLowerCase().includes(q) ||
          (r.restaurant ?? "").toLowerCase().includes(q) ||
          r.reportedBy.toLowerCase().includes(q),
      );
    }
    const sorted = [...rows].sort((a, b) => {
      const dir = sortAsc ? 1 : -1;
      if (sortKey === "createdAt") return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return dir * String(a[sortKey]).localeCompare(String(b[sortKey]));
    });
    return sorted;
  }, [data, search, sortKey, sortAsc]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortAsc((v) => !v);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
    setPage(0);
  }

  return (
    <CardShell title={`Reporting Details (${filtered.length})`}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
          <Search size={14} color="#94A3B8" style={{ position: "absolute", left: 10, top: 9 }} />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search name, equipment, location, reporter…"
            style={{
              width: "100%", fontSize: 12.5, padding: "8px 10px 8px 30px", borderRadius: 8,
              border: "1px solid #E2E8F0", outline: "none",
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <EmptyState label="Loading…" />
      ) : filtered.length === 0 ? (
        <EmptyState label="No requests match this range" />
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #EEF0FF" }}>
                  {([
                    ["name", "Request"],
                    ["status", "Status"],
                    ["priority", "Priority"],
                  ] as [SortKey, string][]).map(([key, label]) => (
                    <th
                      key={key}
                      onClick={() => toggleSort(key)}
                      style={{ textAlign: "left", padding: "8px 10px", color: "#64748B", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        {label} <ArrowUpDown size={11} />
                      </span>
                    </th>
                  ))}
                  <th style={{ textAlign: "left", padding: "8px 10px", color: "#64748B" }}>Equipment</th>
                  <th style={{ textAlign: "left", padding: "8px 10px", color: "#64748B" }}>Location</th>
                  <th style={{ textAlign: "left", padding: "8px 10px", color: "#64748B" }}>Technician(s)</th>
                  <th
                    onClick={() => toggleSort("createdAt")}
                    style={{ textAlign: "left", padding: "8px 10px", color: "#64748B", cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      Created <ArrowUpDown size={11} />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r) => {
                  const statusCfg = MAINTENANCE_STATUS_CONFIG[r.status as keyof typeof MAINTENANCE_STATUS_CONFIG];
                  const priorityCfg = PRIORITY_CONFIG[r.priority as keyof typeof PRIORITY_CONFIG];
                  return (
                    <tr key={r.id} style={{ borderBottom: "1px solid #F8FAFF" }}>
                      <td style={{ padding: "9px 10px", fontWeight: 600, color: "#0F172A", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.name}
                      </td>
                      <td style={{ padding: "9px 10px" }}>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: statusCfg?.dot ?? "#94A3B8" }}>
                          {statusCfg?.label ?? r.status}
                        </span>
                      </td>
                      <td style={{ padding: "9px 10px" }}>
                        <span
                          style={{
                            fontSize: 10.5, fontWeight: 700, color: priorityCfg?.text ?? "#94A3B8",
                            background: priorityCfg?.bg ?? "#F8FAFF", border: `1px solid ${priorityCfg?.border ?? "#EEF0FF"}`,
                            borderRadius: 6, padding: "2px 7px",
                          }}
                        >
                          {r.priority}
                        </span>
                      </td>
                      <td style={{ padding: "9px 10px", color: "#334155" }}>{r.equipmentName}</td>
                      <td style={{ padding: "9px 10px", color: "#334155" }}>{r.restaurant ?? "—"}</td>
                      <td style={{ padding: "9px 10px", color: "#334155" }}>
                        {r.technicianNames.length ? r.technicianNames.join(", ") : "—"}
                      </td>
                      <td style={{ padding: "9px 10px", color: "#94A3B8", whiteSpace: "nowrap" }}>
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pageCount > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                style={{ fontSize: 12, padding: "5px 10px", borderRadius: 6, border: "1px solid #E2E8F0", background: "#fff", cursor: page === 0 ? "not-allowed" : "pointer", opacity: page === 0 ? 0.5 : 1 }}
              >
                Prev
              </button>
              <span style={{ fontSize: 12, color: "#64748B" }}>
                Page {page + 1} of {pageCount}
              </span>
              <button
                disabled={page >= pageCount - 1}
                onClick={() => setPage((p) => p + 1)}
                style={{ fontSize: 12, padding: "5px 10px", borderRadius: 6, border: "1px solid #E2E8F0", background: "#fff", cursor: page >= pageCount - 1 ? "not-allowed" : "pointer", opacity: page >= pageCount - 1 ? 0.5 : 1 }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </CardShell>
  );
}