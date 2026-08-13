"use client";

import { CSSProperties, useMemo, useState } from "react";
import { useGetAllMaintenanceRequestsQuery } from "@/redux/Maintenance/Maintenanceapi";
import { BRAND_GRADIENT } from "@/types/Procedureui";


interface AttachProcedureModalProps {
  open: boolean;
  onClose: () => void;
  procedureTitle: string;
  onAttach: (requestIds: number[]) => Promise<void>;
  isSubmitting: boolean;
}

export function AttachProcedureModal({
  open,
  onClose,
  procedureTitle,
  onAttach,
  isSubmitting,
}: AttachProcedureModalProps) {
  const { data } = useGetAllMaintenanceRequestsQuery(undefined, { skip: !open });
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const openRequests = useMemo(
    () => (data?.data?.requests ?? []).filter((r) => r.state !== "done" && r.state !== "cancel"),
    [data],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return openRequests;
    return openRequests.filter(
      (r) => r.name.toLowerCase().includes(q) || r.equipment?.name?.toLowerCase().includes(q) || `${r.id}`.includes(q),
    );
  }, [openRequests, search]);

  if (!open) return null;

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleClose = () => {
    setSelected(new Set());
    setSearch("");
    onClose();
  };

  const handleSubmit = async () => {
    if (selected.size === 0) return;
    await onAttach([...selected]);
    setSelected(new Set());
    setSearch("");
  };

  return (
    <div
      onClick={handleClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(17,24,39,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 60,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 460,
          maxWidth: "100%",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 24px 60px rgba(17,24,39,0.25)",
        }}
      >
        <div style={{ padding: "20px 22px 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111827", margin: 0 }}>Attach to work orders</h2>
              <p style={{ fontSize: 12, color: "#9CA3AF", margin: "2px 0 0" }}>“{procedureTitle}”</p>
            </div>
            <button onClick={handleClose} style={iconButtonStyle} aria-label="Close">
              <i className="ti ti-x" style={{ fontSize: 16 }} aria-hidden="true" />
            </button>
          </div>

          <div style={{ position: "relative", marginTop: 12 }}>
            <i
              className="ti ti-search"
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#9CA3AF" }}
              aria-hidden="true"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search open work orders…"
              style={{
                width: "100%",
                padding: "9px 12px 9px 32px",
                borderRadius: 9,
                border: "1px solid #E5E7EB",
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 14px" }}>
          {filtered.length === 0 ? (
            <p style={{ textAlign: "center", fontSize: 12.5, color: "#9CA3AF", padding: "24px 0" }}>
              No open work orders match.
            </p>
          ) : (
            filtered.map((r) => {
              const checked = selected.has(r.id);
              return (
                <label
                  key={r.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 8px",
                    borderRadius: 9,
                    cursor: "pointer",
                    background: checked ? "#EEF2FF" : "transparent",
                  }}
                >
                  <input type="checkbox" checked={checked} onChange={() => toggle(r.id)} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      #{r.id} · {r.name}
                    </p>
                    <p style={{ fontSize: 11.5, color: "#9CA3AF", margin: "1px 0 0" }}>{r.equipment?.name ?? "No asset"}</p>
                  </div>
                </label>
              );
            })
          )}
        </div>

        <div style={{ padding: 16, borderTop: "1px solid #F3F4F6", display: "flex", gap: 10 }}>
          <button onClick={handleClose} style={{ ...ghostButtonStyle, flex: 1, justifyContent: "center", padding: "10px 0" }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || selected.size === 0}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 10,
              border: "none",
              background: BRAND_GRADIENT,
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: isSubmitting || selected.size === 0 ? "default" : "pointer",
              opacity: isSubmitting || selected.size === 0 ? 0.6 : 1,
            }}
          >
            {isSubmitting ? "Attaching…" : `Attach to ${selected.size || ""} work order${selected.size === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>
    </div>
  );
}

const iconButtonStyle: CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 8,
  border: "1px solid #E5E7EB",
  background: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  flexShrink: 0,
};

const ghostButtonStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 12px",
  borderRadius: 9,
  border: "1px solid #E5E7EB",
  background: "#fff",
  color: "#374151",
  fontSize: 12.5,
  fontWeight: 700,
  cursor: "pointer",
};