"use client";

import { CSSProperties, useMemo, useState } from "react";
import { useGetAllMaintenanceRequestsQuery } from "@/redux/Maintenance/Maintenanceapi";
import { BRAND_GRADIENT } from "@/types/Procedureui";


interface AttachProcedureModalProps {
  open: boolean;
  onClose: () => void;
  procedureTitle: string;
  procedureStatus: "draft" | "published";
  onAttach: (requestIds: number[]) => Promise<void>;
  isSubmitting: boolean;
}

export function AttachProcedureModal({
  open,
  onClose,
  procedureTitle,
  procedureStatus,
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
    if (selected.size === 0 || procedureStatus !== "published") return;
    await onAttach([...selected]);
    setSelected(new Set());
    setSearch("");
  };

  const isDraft = procedureStatus !== "published";
  const submitDisabled = isSubmitting || selected.size === 0 || isDraft;

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
        {/* Header — title + close only, no search here */}
        <div style={{ padding: "20px 22px 12px", borderBottom: "1px solid #F3F4F6" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111827", margin: 0 }}>Attach to work orders</h2>
              <p
                style={{
                  fontSize: 12,
                  color: "#9CA3AF",
                  margin: "2px 0 0",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                “{procedureTitle}”
              </p>
            </div>
            <button onClick={handleClose} style={iconButtonStyle} aria-label="Close">
              <i className="ti ti-x" style={{ fontSize: 16 }} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", minHeight: 0 }}>
          {isDraft ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 30,
              }}
            >
              <div
                style={{
                  width: "100%",
                  padding: "18px 16px",
                  fontSize: 13,
                  color: "#B45309",
                  background: "#FFFBEB",
                  border: "1px solid #FDE68A",
                  borderRadius: 10,
                  lineHeight: 1.6,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <i
                    className="ti ti-alert-circle"
                    style={{ fontSize: 18, marginTop: 1, flexShrink: 0 }}
                    aria-hidden="true"
                  />
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 3 }}>This procedure is still a draft</div>
                    <div>Publish it first from the procedure detail page before attaching it to work orders.</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Search */}
              <div style={{ position: "relative", padding: "14px 22px 12px" }}>
                <i
                  className="ti ti-search"
                  style={{
                    position: "absolute",
                    left: 34,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 14,
                    color: "#9CA3AF",
                  }}
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

              {/* List */}
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
                          <p
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#111827",
                              margin: 0,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            #{r.id} · {r.name}
                          </p>
                          <p style={{ fontSize: 11.5, color: "#9CA3AF", margin: "1px 0 0" }}>
                            {r.equipment?.name ?? "No asset"}
                          </p>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: 16, borderTop: "1px solid #F3F4F6", display: "flex", gap: 10 }}>
          <button onClick={handleClose} style={{ ...ghostButtonStyle, flex: 1, justifyContent: "center", padding: "10px 0" }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitDisabled}
            title={isDraft ? "Publish this procedure before attaching it to work orders" : undefined}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 10,
              border: "none",
              background: BRAND_GRADIENT,
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: submitDisabled ? "default" : "pointer",
              opacity: submitDisabled ? 0.6 : 1,
            }}
          >
            {isSubmitting
              ? "Attaching…"
              : isDraft
              ? "Publish required"
              : `Attach to ${selected.size || ""} work order${selected.size === 1 ? "" : "s"}`}
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