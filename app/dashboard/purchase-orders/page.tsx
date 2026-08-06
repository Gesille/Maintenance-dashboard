/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Plus,
  X,
  Check,
  Ban,
  Truck,
  PackageCheck,
  Pencil,
  Trash2,
  Search,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Loader,
  AlertCircle,
  ShoppingCart,
  Package,
  PackagePlus,
} from "lucide-react";
import {
  PurchaseOrderStatus,
  PurchaseOrderListItem,
  useGetAllPurchaseOrdersQuery,
  useDeletePurchaseOrderMutation,
  useApprovePurchaseOrderMutation,
  useDeclinePurchaseOrderMutation,
  useMarkPurchaseOrderAsOrderedMutation,
  useCancelPurchaseOrderMutation,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  PurchaseOrderFormInput,
  EMPTY_PURCHASE_ORDER_FORM,
  LineItemInput,
  useFulfillPurchaseOrderItemsMutation,
  FulfillItemInput,
} from "@/redux/purchase-orders/Purchaseorderapi";
import { WorkOrderSidebar } from "@/component/Sidebar";
import { useGetAllPartsQuery } from "@/redux/Part/Partapi";
import { Part } from "@/types/Part";

// ─────────────────────────────────────────────────────────────────────────────
// Tokens
// ─────────────────────────────────────────────────────────────────────────────

const PO_STATUS_CONFIG: Record<
  PurchaseOrderStatus,
  { bg: string; text: string; border: string; dot: string; label: string }
> = {
  requested: { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A", dot: "#F59E0B", label: "Requested" },
  declined: { bg: "#FFF1F2", text: "#BE123C", border: "#FECDD3", dot: "#F43F5E", label: "Declined" },
  approved: { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE", dot: "#3B82F6", label: "Approved" },
  ordered: { bg: "#EEF2FF", text: "#4338CA", border: "#C7D2FE", dot: "#6366F1", label: "Ordered" },
  partially_fulfilled: { bg: "#F5F3FF", text: "#6D28D9", border: "#DDD6FE", dot: "#8B5CF6", label: "Partially fulfilled" },
  fulfilled: { bg: "#ECFDF5", text: "#047857", border: "#A7F3D0", dot: "#10B981", label: "Fulfilled" },
  cancelled: { bg: "#F1F5F9", text: "#64748B", border: "#E2E8F0", dot: "#94A3B8", label: "Cancelled" },
};

const STATUS_ORDER: PurchaseOrderStatus[] = [
  "requested",
  "approved",
  "ordered",
  "partially_fulfilled",
  "fulfilled",
  "declined",
  "cancelled",
];

// Column templates live in ONE place so the header and every row always
// agree on how many cells exist. This is what was broken before: the
// non-admin row rendered 7 cells against a 6-column template, so the last
// cell (the chevron) wrapped onto a phantom second row instead of sitting
// at the end of the row.
function gridTemplate(isAdmin: boolean) {
  return isAdmin
    ? "1fr 1.6fr 1.3fr 0.7fr 0.9fr 1.3fr 0.4fr 0.4fr" // PO#, Vendor, Status, Items, Total, Requested by, Actions, Chevron
    : "1fr 1.6fr 1.3fr 0.7fr 1.3fr 0.4fr"; // PO#, Vendor, Status, Items, Requested by, Chevron
}

function currency(n: number | undefined) {
  if (n === undefined) return "—";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

// ─────────────────────────────────────────────────────────────────────────────
// Small building blocks
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PurchaseOrderStatus }) {
  const c = PO_STATUS_CONFIG[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        borderRadius: 999,
        border: `1.5px solid ${c.border}`,
        padding: "5px 10px",
        fontSize: 12,
        fontWeight: 600,
        background: c.bg,
        color: c.text,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot }} />
      {c.label}
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
        color: "#fff",
        fontSize: 11,
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {initials(name) || "?"}
    </div>
  );
}

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
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "7px 14px",
        borderRadius: 10,
        fontSize: 12,
        fontWeight: 600,
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
          fontSize: 11,
          fontWeight: 700,
          padding: "1px 6px",
          borderRadius: 999,
          background: active ? "#C7D2FE55" : "#F1F5F9",
          color: active ? "#4338CA" : "#94A3B8",
        }}
      >
        {value}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function PurchaseOrdersPage() {
  const user = useSelector((state: any) => state.auth?.user);
  const isAdmin = user?.role === "Enduser"; 

  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrderListItem | null>(null);
  const [detailPO, setDetailPO] = useState<PurchaseOrderListItem | null>(null);
  const [fulfillPO, setFulfillPO] = useState<PurchaseOrderListItem | null>(null);
  const [declinePOId, setDeclinePOId] = useState<number | null>(null);

  const { data, isLoading, isFetching, isError, refetch } = useGetAllPurchaseOrdersQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    search: search || undefined,
  });

  const { data: allData } = useGetAllPurchaseOrdersQuery({});

  const [deletePurchaseOrder] = useDeletePurchaseOrderMutation();
  const [approvePurchaseOrder] = useApprovePurchaseOrderMutation();
  const [declinePurchaseOrder] = useDeclinePurchaseOrderMutation();
  const [markAsOrdered] = useMarkPurchaseOrderAsOrderedMutation();
  const [cancelPurchaseOrder] = useCancelPurchaseOrderMutation();

  const orders = data?.data ?? [];
  const allOrders = allData?.data ?? [];

  const counts = useMemo(() => {
    const base: Record<PurchaseOrderStatus | "all", number> = {
      all: allOrders.length,
      requested: 0,
      declined: 0,
      approved: 0,
      ordered: 0,
      partially_fulfilled: 0,
      fulfilled: 0,
      cancelled: 0,
    };
    for (const po of allOrders) base[po.status]++;
    return base;
  }, [allOrders]);

  const pendingApprovalCount = counts.requested;
  const columns = gridTemplate(isAdmin);

  if (isLoading) {
    return (
      <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#F8FAFF" }}>
        <WorkOrderSidebar />
        <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 13, color: "#94A3B8" }}>Loading purchase orders…</span>
        </main>
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#F8FAFF" }}>
        <WorkOrderSidebar />
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            background: "#FFF5F5",
          }}
        >
          <span style={{ fontSize: 13, color: "#DC2626" }}>Failed to load purchase orders.</span>
          <button
            onClick={() => refetch()}
            style={{
              padding: "8px 18px",
              background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
              color: "#fff",
              border: "none",
              borderRadius: 9,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
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
                Purchase Orders
              </h1>
              <span style={{ fontSize: 12, color: "#64748B" }}>
                {isAdmin
                  ? "Request, approve, and fulfill orders from your vendors."
                  : "Request parts and track the status of your orders."}
              </span>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => refetch()}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 16px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#374151",
                  background: "#fff",
                  border: "1.5px solid #E0E7FF",
                  borderRadius: 10,
                  cursor: "pointer",
                }}
              >
                <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
                Refresh
              </button>
              <button
                onClick={() => setCreateOpen(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 16px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#fff",
                  background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                  border: "none",
                  borderRadius: 10,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
                }}
              >
                <Plus size={14} />
                {isAdmin ? "New purchase order" : "Request purchase order"}
              </button>
            </div>
          </div>

          {/* Manager-only: pending approval callout, same treatment as the
              low-stock banner on the Parts page, so it can't be missed. */}
          {isAdmin && pendingApprovalCount > 0 && (
            <button
              onClick={() => setStatusFilter("requested")}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                padding: "10px 14px",
                marginBottom: 14,
                borderRadius: 10,
                border: "1px solid #FDE68A",
                background: "#FFFBEB",
                cursor: "pointer",
                textAlign: "left",
                boxSizing: "border-box",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, color: "#B45309" }}>
                <AlertCircle size={14} />
                {pendingApprovalCount} {pendingApprovalCount === 1 ? "request needs" : "requests need"} your approval
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "#B45309", textDecoration: statusFilter === "requested" ? "none" : "underline" }}>
                {statusFilter === "requested" ? "Showing" : "Review now"}
              </span>
            </button>
          )}

          {/* Status filter chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            <StatChip label="All" value={counts.all} active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
            {STATUS_ORDER.map((s) => (
              <StatChip
                key={s}
                label={PO_STATUS_CONFIG[s].label}
                value={counts[s]}
                dotColor={PO_STATUS_CONFIG[s].dot}
                active={statusFilter === s}
                onClick={() => setStatusFilter(s)}
              />
            ))}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#fff",
              borderRadius: 10,
              padding: "0 12px",
              height: 36,
              border: "1.5px solid #E0E7FF",
              maxWidth: 360,
            }}
          >
            <Search size={13} color="#A5B4FC" strokeWidth={2} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search PO number or vendor…"
              style={{ border: "none", background: "transparent", fontSize: 12, color: "#0F172A", outline: "none", width: "100%" }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
          {orders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 20px", color: "#94A3B8", fontSize: 13 }}>
              <ShoppingCart size={22} style={{ marginBottom: 8 }} />
              <div>No purchase orders yet. Create one to get started.</div>
            </div>
          ) : (
            <div style={{ background: "#fff", border: "1px solid #E8EAFF", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(99,102,241,0.06)" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: columns,
                  padding: "12px 20px",
                  background: "#FAFBFF",
                  borderBottom: "1px solid #E8EAFF",
                }}
              >
                {(isAdmin
                  ? ["PO #", "Vendor", "Status", "Items", "Total", "Requested by", "", ""]
                  : ["PO #", "Vendor", "Status", "Items", "Requested by", ""]
                ).map((h, i) => (
                  <span key={i} style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94A3B8" }}>
                    {h}
                  </span>
                ))}
              </div>

              {orders.map((po) => (
                <div
                  key={po.id}
                  onClick={() => setDetailPO(po)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: columns,
                    alignItems: "center",
                    padding: "14px 20px",
                    borderBottom: "1px solid #F0F4FF",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFBFF")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{po.poNumber}</span>
                  <span style={{ fontSize: 13, color: "#334155", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {po.vendor ?? "—"}
                  </span>
                  <div>
                    <StatusBadge status={po.status} />
                  </div>
                  <span style={{ fontSize: 13, color: "#64748B" }}>{po.items.length}</span>
                  {isAdmin && <span style={{ fontSize: 13, color: "#64748B" }}>{currency(po.totalCost)}</span>}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <Avatar name={po.createdByName} />
                    <span style={{ fontSize: 12, color: "#64748B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {po.createdByName}
                    </span>
                  </div>
                  {/* Actions column only exists in the grid for admins now —
                      matches the header, which only has 8 labels (incl. two
                      blanks) for admins and 6 for everyone else. */}
                  {isAdmin && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <RowActions
                        po={po}
                        onEdit={() => setEditingPO(po)}
                        onDelete={() => deletePurchaseOrder(po.id)}
                        onApprove={() => approvePurchaseOrder(po.id)}
                        onDecline={() => setDeclinePOId(po.id)}
                        onMarkOrdered={() => markAsOrdered(po.id)}
                        onCancel={() => cancelPurchaseOrder(po.id)}
                        onFulfill={() => setFulfillPO(po)}
                      />
                    </div>
                  )}
                  <div style={{ textAlign: "right" }}>
                    <ChevronRight size={14} color="#CBD5E1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {(isCreateOpen || editingPO) && (
        <PurchaseOrderFormDrawer
          existing={editingPO}
          onClose={() => {
            setCreateOpen(false);
            setEditingPO(null);
          }}
        />
      )}

      {detailPO && <PurchaseOrderDrawer po={detailPO} isAdmin={isAdmin} onClose={() => setDetailPO(null)} />}

      {fulfillPO && <FulfillItemsModal po={fulfillPO} onClose={() => setFulfillPO(null)} />}

      {declinePOId !== null && (
        <DeclineModal
          onClose={() => setDeclinePOId(null)}
          onConfirm={(reason) => {
            declinePurchaseOrder({ id: declinePOId, reason });
            setDeclinePOId(null);
          }}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .animate-spin { animation: spin 0.7s linear infinite; }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Row actions dropdown — admin-only, so this component is now only ever
// mounted when isAdmin is true (see the conditional render above). No more
// "return null but still take up a grid cell" bug.
// ─────────────────────────────────────────────────────────────────────────────


import { useRef } from "react";
import { createPortal } from "react-dom";

function RowActions({
  po,
  onEdit,
  onDelete,
  onApprove,
  onDecline,
  onMarkOrdered,
  onCancel,
  onFulfill,
}: {
  po: PurchaseOrderListItem;
  onEdit: () => void;
  onDelete: () => void;
  onApprove: () => void;
  onDecline: () => void;
  onMarkOrdered: () => void;
  onCancel: () => void;
  onFulfill: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const canCancel = !po.items.some((i) => i.quantityFulfilled > 0);

  function toggleOpen() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 6, left: rect.right - 190 });
    }
    setOpen((v) => !v);
  }

  return (
    <div style={{ position: "relative", display: "flex", justifyContent: "flex-end" }}>
      <button
        ref={btnRef}
        onClick={toggleOpen}
        style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: 6, borderRadius: 8, display: "flex" }}
      >
        <ChevronDown size={15} />
      </button>

      {open && coords &&
        createPortal(
          <>
            <div style={{ position: "fixed", inset: 0, zIndex: 1000 }} onClick={() => setOpen(false)} />
            <div
              style={{
                position: "fixed",
                top: coords.top,
                left: coords.left,
                zIndex: 1001,
                width: 190,
                borderRadius: 12,
                border: "1px solid #E8EAFF",
                background: "#fff",
                padding: "6px 0",
                boxShadow: "0 12px 32px rgba(15,23,42,0.14)",
              }}
            >
              {po.status === "requested" && (
                <>
                  <MenuItem icon={Check} label="Approve" onClick={() => { onApprove(); setOpen(false); }} />
                  <MenuItem icon={Ban} label="Decline" onClick={() => { onDecline(); setOpen(false); }} />
                  <MenuItem icon={Pencil} label="Edit" onClick={() => { onEdit(); setOpen(false); }} />
                </>
              )}
              {po.status === "approved" && (
                <>
                  <MenuItem icon={Truck} label="Mark as ordered" onClick={() => { onMarkOrdered(); setOpen(false); }} />
                  <MenuItem icon={Pencil} label="Edit" onClick={() => { onEdit(); setOpen(false); }} />
                </>
              )}
              {(po.status === "ordered" || po.status === "partially_fulfilled") && (
                <MenuItem icon={PackageCheck} label="Fulfill items" onClick={() => { onFulfill(); setOpen(false); }} />
              )}
              {canCancel && !["cancelled", "declined", "fulfilled"].includes(po.status) && (
                <MenuItem icon={Ban} label="Cancel" onClick={() => { onCancel(); setOpen(false); }} />
              )}
              <MenuItem icon={Trash2} label="Delete" danger onClick={() => { onDelete(); setOpen(false); }} />
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof Check;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        width: "100%",
        alignItems: "center",
        gap: 8,
        padding: "8px 14px",
        fontSize: 12.5,
        fontWeight: 600,
        color: danger ? "#DC2626" : "#374151",
        background: "none",
        border: "none",
        textAlign: "left",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFBFF")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <Icon size={13.5} />
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared: field / input styles
// ─────────────────────────────────────────────────────────────────────────────

const fieldLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#94A3B8",
  marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "9px 12px",
  fontSize: 13,
  color: "#0F172A",
  background: "#FAFBFF",
  border: "1.5px solid #E8EAFF",
  borderRadius: 9,
  outline: "none",
  fontFamily: "inherit",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <span style={fieldLabelStyle}>{label}</span>
      {children}
    </label>
  );
}

function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled,
  danger,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "9px 18px",
        fontSize: 12.5,
        fontWeight: 600,
        color: "#fff",
        background: disabled ? "#A5B4FC" : danger ? "#E11D48" : "linear-gradient(135deg, #6366F1, #8B5CF6)",
        border: "none",
        borderRadius: 9,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "9px 18px",
        fontSize: 12.5,
        fontWeight: 600,
        color: "#64748B",
        background: "#fff",
        border: "1.5px solid #E8EAFF",
        borderRadius: 9,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Slide-in drawer shell
// ─────────────────────────────────────────────────────────────────────────────

function DrawerShell({
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", justifyContent: "flex-end" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.4)" }} onClick={onClose} />
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          width: "100%",
          maxWidth: wide ? 620 : 440,
          background: "#fff",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid #F0F4FF" }}>
          <div>
            {subtitle && <div style={{ fontSize: 11, color: "#94A3B8", fontFamily: "monospace" }}>{subtitle}</div>}
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: "2px 0 0" }}>{title}</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px" }}>{children}</div>

        {footer && (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "16px 22px", borderTop: "1px solid #F0F4FF" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}


function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
type LineMode = "search" | "oneoff";

function PartLineItemRow({
  item,
  index,
  onChange,
  onRemove,
}: {
  item: LineItemInput;
  index: number;
  onChange: (index: number, patch: Partial<LineItemInput>) => void;
  onRemove: (index: number) => void;
}) {
  const [mode, setMode] = useState<LineMode>(item.partId ? "search" : item.partName ? "oneoff" : "search");
  const [selectedMeta, setSelectedMeta] = useState<{ partNumber: string | null; qtyOnHand: number; unit: string } | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const { data, isFetching } = useGetAllPartsQuery(
    { search: query },
    { skip: query.trim().length < 2 },
  );
  const results: Part[] = data?.data ?? [];

  function selectPart(p: Part) {
    onChange(index, { partId: p.id, partName: p.name, unitCost: p.unitCost });
    setSelectedMeta({ partNumber: p.partNumber, qtyOnHand: p.quantityOnHand, unit: p.unitOfMeasure });
    setQuery("");
    setOpen(false);
  }

  function clearSelection() {
    onChange(index, { partId: undefined, partName: "", unitCost: 0 });
    setSelectedMeta(null);
  }

  function switchToOneOff(prefill?: string) {
    clearSelection();
    setMode("oneoff");
    if (prefill) onChange(index, { partName: prefill });
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 84px 100px 28px", alignItems: "start", gap: 8 }}>
      <div style={{ position: "relative" }}>
        {item.partId ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              padding: "9px 10px",
              borderRadius: 9,
              border: "1.5px solid #C7D2FE",
              background: "#EEF2FF",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <Package size={14} color="#4338CA" style={{ flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "#3730A3", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.partName}
                </div>
                {selectedMeta && (
                  <div style={{ fontSize: 10.5, color: "#6366F1" }}>
                    {selectedMeta.partNumber ?? "No part #"} · {selectedMeta.qtyOnHand} {selectedMeta.unit} in stock
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={clearSelection}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#6366F1", flexShrink: 0, display: "flex" }}
            >
              <X size={13} />
            </button>
          </div>
        ) : mode === "oneoff" ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              value={item.partName ?? ""}
              onChange={(e) => onChange(index, { partName: e.target.value })}
              placeholder="One-off item name"
              style={inputStyle}
              autoFocus
            />
            <button
              type="button"
              onClick={() => { setMode("search"); onChange(index, { partName: "" }); }}
              title="Search inventory instead"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", flexShrink: 0, display: "flex" }}
            >
              <Search size={14} />
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#FAFBFF",
                border: "1.5px solid #E8EAFF",
                borderRadius: 9,
                padding: "0 12px",
                height: 36,
              }}
            >
              <Search size={13} color="#A5B4FC" />
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                placeholder="Search parts by name or #…"
                style={{ border: "none", background: "transparent", fontSize: 13, outline: "none", width: "100%" }}
              />
            </div>

            {open && query.trim().length >= 2 && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  right: 0,
                  zIndex: 30,
                  background: "#fff",
                  border: "1px solid #E8EAFF",
                  borderRadius: 10,
                  boxShadow: "0 12px 32px rgba(15,23,42,0.14)",
                  maxHeight: 240,
                  overflowY: "auto",
                }}
              >
                {isFetching && <div style={{ padding: 12, fontSize: 12, color: "#94A3B8" }}>Searching…</div>}

                {!isFetching && results.length === 0 && (
                  <button
                    type="button"
                    onMouseDown={() => switchToOneOff(query)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, width: "100%",
                      padding: "12px", border: "none", background: "none", cursor: "pointer", textAlign: "left",
                    }}
                  >
                    <PackagePlus size={14} color="#6366F1" />
                    <span style={{ fontSize: 12.5 }}>
                      No matching parts — add &quot;{query}&quot; as a one-off item
                    </span>
                  </button>
                )}

                {results.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onMouseDown={() => selectPart(p)}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%",
                      padding: "10px 12px", border: "none", background: "none", textAlign: "left", cursor: "pointer",
                      borderBottom: "1px solid #F0F4FF",
                    }}
                  >
                    <span style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: "#94A3B8" }}>
                        {p.partNumber ?? "No part #"} · {p.quantityOnHand} {p.unitOfMeasure} on hand
                        {p.isLowStock && <span style={{ color: "#DC2626", fontWeight: 700 }}> · low stock</span>}
                      </div>
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#6366F1", flexShrink: 0 }}>
                      {p.unitCost.toLocaleString(undefined, { style: "currency", currency: "USD" })}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <input
        type="number"
        min={1}
        value={item.quantityOrdered}
        onChange={(e) => onChange(index, { quantityOrdered: Number(e.target.value) })}
        style={inputStyle}
        placeholder="Qty"
      />
      <input
        type="number"
        min={0}
        step="0.01"
        value={item.unitCost ?? 0}
        onChange={(e) => onChange(index, { unitCost: Number(e.target.value) })}
        style={inputStyle}
        placeholder="Unit cost"
      />
      <button
        type="button"
        onClick={() => onRemove(index)}
        style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: 4, borderRadius: 6 }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Create / edit drawer
// ─────────────────────────────────────────────────────────────────────────────

function PurchaseOrderFormDrawer({
  existing,
  onClose,
}: {
  existing: PurchaseOrderListItem | null;
  onClose: () => void;
}) {
  const [createPurchaseOrder, { isLoading: isCreating }] = useCreatePurchaseOrderMutation();
  const [updatePurchaseOrder, { isLoading: isUpdating }] = useUpdatePurchaseOrderMutation();

  const [form, setForm] = useState<PurchaseOrderFormInput>(() =>
    existing
      ? {
          vendor: existing.vendor,
          vendorContact: existing.vendorContact,
          items: existing.items.map((i) => ({
            partId: i.partId ?? undefined,
            partName: i.partName,
            quantityOrdered: i.quantityOrdered,
            unitCost: i.unitCost,
          })),
          taxAmount: existing.taxAmount ?? 0,
          additionalCosts: existing.additionalCosts ?? [],
          expectedDeliveryDate: existing.expectedDeliveryDate,
          notes: existing.notes,
        }
      : EMPTY_PURCHASE_ORDER_FORM,
  );

  const isSaving = isCreating || isUpdating;

  function updateItem(index: number, patch: Partial<LineItemInput>) {
    setForm((f) => ({ ...f, items: f.items.map((it, i) => (i === index ? { ...it, ...patch } : it)) }));
  }

  function addItem() {
    setForm((f) => ({ ...f, items: [...f.items, { partId: undefined, partName: "", quantityOrdered: 1, unitCost: 0 }] }));
  }

  function removeItem(index: number) {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
  }

  async function handleSave() {
    if (existing) {
      await updatePurchaseOrder({ id: existing.id, data: form });
    } else {
      await createPurchaseOrder(form);
    }
    onClose();
  }

  return (
    <DrawerShell
      title={existing ? "Edit purchase order" : "New purchase order"}
      onClose={onClose}
      wide
      footer={
        <>
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving…" : existing ? "Save changes" : "Submit"}
          </PrimaryButton>
        </>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
        <Field label="Vendor (optional)">
          <input
            value={form.vendor ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value || null }))}
            style={inputStyle}
            placeholder="Acme Supply Co."
          />
        </Field>
        <Field label="Vendor contact">
          <input
            value={form.vendorContact ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, vendorContact: e.target.value || null }))}
            style={inputStyle}
            placeholder="contact@acme.com"
          />
        </Field>
      </div>

 <div style={{ marginBottom: 18 }}>
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
    <span style={fieldLabelStyle}>Line items</span>
    <button type="button" onClick={addItem} style={{ fontSize: 12, fontWeight: 600, color: "#6366F1", background: "none", border: "none", cursor: "pointer" }}>
      + Add item
    </button>
  </div>

  <div style={{ display: "grid", gridTemplateColumns: "1fr 84px 100px 28px", gap: 8, marginBottom: 6, padding: "0 2px" }}>
    <span style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Item</span>
    <span style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Qty</span>
    <span style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Unit cost</span>
    <span />
  </div>

  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    {form.items.map((item, i) => (
      <PartLineItemRow key={i} item={item} index={i} onChange={updateItem} onRemove={removeItem} />
    ))}
  </div>
</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
        <Field label="Tax amount">
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.taxAmount}
            onChange={(e) => setForm((f) => ({ ...f, taxAmount: Number(e.target.value) }))}
            style={inputStyle}
          />
        </Field>
        <Field label="Expected delivery">
          <input
            type="date"
            value={form.expectedDeliveryDate ? form.expectedDeliveryDate.slice(0, 10) : ""}
            onChange={(e) => setForm((f) => ({ ...f, expectedDeliveryDate: e.target.value || null }))}
            style={inputStyle}
          />
        </Field>
      </div>

      <Field label="Notes">
        <textarea
          value={form.notes ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value || null }))}
          rows={4}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </Field>
    </DrawerShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail drawer
// ─────────────────────────────────────────────────────────────────────────────

function PurchaseOrderDrawer({
  po,
  isAdmin,
  onClose,
}: {
  po: PurchaseOrderListItem;
  isAdmin: boolean;
  onClose: () => void;
}) {
  return (
    <DrawerShell title={po.poNumber} subtitle={`Requested by ${po.createdByName}`} onClose={onClose} wide>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <StatusBadge status={po.status} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar name={po.createdByName} />
          <span style={{ fontSize: 12, color: "#64748B" }}>{po.createdByName}</span>
        </div>
      </div>

      {po.declineReason && (
        <p
          style={{
            marginTop: 0,
            marginBottom: 16,
            borderRadius: 10,
            background: "#FFF1F2",
            border: "1px solid #FECDD3",
            padding: "10px 12px",
            fontSize: 13,
            color: "#BE123C",
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
          }}
        >
          <AlertCircle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
          Declined: {po.declineReason}
        </p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
        <div>
          <div style={fieldLabelStyle}>Vendor</div>
          <div style={{ fontSize: 13, color: "#0F172A" }}>{po.vendor ?? "—"}</div>
        </div>
        <div>
          <div style={fieldLabelStyle}>Expected delivery</div>
          <div style={{ fontSize: 13, color: "#0F172A" }}>{formatDate(po.expectedDeliveryDate)}</div>
        </div>
      </div>

      <div style={{ ...fieldLabelStyle, marginBottom: 10 }}>Line items</div>
      <div style={{ borderRadius: 10, border: "1px solid #F0F4FF", overflow: "hidden", marginBottom: 18 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isAdmin ? "1fr 0.7fr 0.8fr 0.8fr" : "1fr 0.7fr 0.8fr",
            padding: "9px 14px",
            background: "#FAFBFF",
            borderBottom: "1px solid #F0F4FF",
          }}
        >
          {(isAdmin ? ["Item", "Ordered", "Fulfilled", "Unit cost"] : ["Item", "Ordered", "Fulfilled"]).map((h) => (
            <span key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#94A3B8" }}>
              {h}
            </span>
          ))}
        </div>
        {po.items.map((item, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: isAdmin ? "1fr 0.7fr 0.8fr 0.8fr" : "1fr 0.7fr 0.8fr",
              padding: "10px 14px",
              borderBottom: i === po.items.length - 1 ? "none" : "1px solid #F0F4FF",
            }}
          >
            <span style={{ fontSize: 13, color: "#334155" }}>
              {item.partName}
              {item.isOneOff && <span style={{ marginLeft: 6, fontSize: 11, color: "#94A3B8" }}>(one-off)</span>}
            </span>
            <span style={{ fontSize: 13, color: "#334155" }}>{item.quantityOrdered}</span>
            <span style={{ fontSize: 13, color: "#334155" }}>{item.quantityFulfilled}</span>
            {isAdmin && <span style={{ fontSize: 13, color: "#334155" }}>{currency(item.unitCost)}</span>}
          </div>
        ))}
      </div>

      {isAdmin && (
        <div style={{ marginLeft: "auto", width: 220, display: "flex", flexDirection: "column", gap: 4, fontSize: 13, marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#64748B" }}>
            <span>Subtotal</span>
            <span>{currency(po.subtotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#64748B" }}>
            <span>Tax</span>
            <span>{currency(po.taxAmount)}</span>
          </div>
          {po.additionalCosts?.map((c, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", color: "#64748B" }}>
              <span>{c.description}</span>
              <span>{currency(c.amount)}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #E8EAFF", paddingTop: 6, fontWeight: 700, color: "#0F172A" }}>
            <span>Total</span>
            <span>{currency(po.totalCost)}</span>
          </div>
        </div>
      )}

      {po.notes && (
        <>
          <div style={{ ...fieldLabelStyle, marginBottom: 8 }}>Notes</div>
          <p style={{ fontSize: 13, color: "#334155", whiteSpace: "pre-wrap", background: "#FAFBFF", border: "1px solid #F0F4FF", borderRadius: 10, padding: 12 }}>
            {po.notes}
          </p>
        </>
      )}
    </DrawerShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Fulfill items — small centered modal
// ─────────────────────────────────────────────────────────────────────────────

function CenteredModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.4)" }} onClick={onClose} />
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 440,
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          padding: 22,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: 4 }}>
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FulfillItemsModal({ po, onClose }: { po: PurchaseOrderListItem; onClose: () => void }) {
  const [fulfillItems, { isLoading }] = useFulfillPurchaseOrderItemsMutation();

  const remaining = po.items.filter((i) => i.quantityFulfilled < i.quantityOrdered);
  const [quantities, setQuantities] = useState<Record<number, number>>(
    Object.fromEntries(remaining.map((_, i) => [i, 0])),
  );

  async function handleSubmit() {
    const items: FulfillItemInput[] = remaining
      .map((item, i) => ({
        partId: item.partId,
        partName: item.partName,
        quantityFulfilled: quantities[i] ?? 0,
      }))
      .filter((i) => i.quantityFulfilled > 0);

    if (items.length === 0) return onClose();
    await fulfillItems({ id: po.id, items });
    onClose();
  }

  return (
    <CenteredModal title={`Fulfill items — ${po.poNumber}`} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {remaining.length === 0 ? (
          <p style={{ fontSize: 13, color: "#94A3B8", margin: 0 }}>All items on this order have already been fulfilled.</p>
        ) : (
          remaining.map((item, i) => {
            const stillDue = item.quantityOrdered - item.quantityFulfilled;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", margin: 0 }}>{item.partName}</p>
                  <p style={{ fontSize: 11, color: "#94A3B8", margin: "2px 0 0" }}>
                    {stillDue} remaining of {item.quantityOrdered}
                  </p>
                </div>
                <input
                  type="number"
                  min={0}
                  max={stillDue}
                  value={quantities[i] ?? 0}
                  onChange={(e) => setQuantities((q) => ({ ...q, [i]: Math.min(Number(e.target.value), stillDue) }))}
                  style={{ ...inputStyle, width: 88 }}
                />
              </div>
            );
          })
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 6 }}>
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader size={12} className="animate-spin" />}
            {isLoading ? "Saving…" : "Confirm fulfillment"}
          </PrimaryButton>
        </div>
      </div>
    </CenteredModal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Decline — small centered modal
// ─────────────────────────────────────────────────────────────────────────────

function DeclineModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState("");

  return (
    <CenteredModal title="Decline request" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Reason (optional)">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            style={{ ...inputStyle, resize: "vertical" }}
            placeholder="Let the requester know why…"
          />
        </Field>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton danger onClick={() => onConfirm(reason)}>
            Decline
          </PrimaryButton>
        </div>
      </div>
    </CenteredModal>
  );
}