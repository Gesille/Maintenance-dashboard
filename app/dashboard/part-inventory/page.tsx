/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useMemo, useState } from "react";
import { WorkOrderSidebar } from "@/component/Sidebar";

import { useGetAllCategoriesQuery } from "@/redux/Category/Categoryapi";
import { useGetAllEquipmentQuery } from "@/redux/Equipment/Equipmentapi";
import { useGetAllPartsQuery, useGetPartStockHistoryQuery, useRestockPartMutation, useConsumePartMutation, useAdjustPartQuantityMutation, useLinkPartToEquipmentMutation, useUnlinkPartFromEquipmentMutation, useDeletePartMutation, CreatePartInput, useCreatePartMutation } from "@/redux/part/Partapi";
import { Part, EMPTY_PART_FORM } from "@/types/Part";


const STOCK_HEALTH = {
  low: { label: "Low stock", bg: "#FEF2F2", text: "#B91C1C", border: "#FECACA", dot: "#EF4444" },
  ok: { label: "In stock", bg: "#F0FDF4", text: "#166534", border: "#BBF7D0", dot: "#22C55E" },
} as const;

const GRADIENT = "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function stockHealth(part: Part): keyof typeof STOCK_HEALTH {
  return part.isLowStock ? "low" : "ok";
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PartsInventoryPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newPartOpen, setNewPartOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useGetAllPartsQuery({
    search: search || undefined,
    category: category || undefined,
    lowStockOnly,
  });
  const { data: categoryData } = useGetAllCategoriesQuery();
  const { data: equipmentData } = useGetAllEquipmentQuery();

  const parts = data?.data ?? [];
  const categories = categoryData?.data ?? [];
  const equipmentOptions = useMemo(
    () => (equipmentData?.data ?? []).filter((e: any) => e.active !== false),
    [equipmentData],
  );

  const effectiveId = selectedId ?? parts[0]?.id ?? null;
  const selectedPart = parts.find((p) => p.id === effectiveId) ?? null;

  const handleSelect = useCallback((p: Part) => setSelectedId(p.id), []);

  // ── Loading state ──
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #F5F3FF 0%, #EEF2FF 50%, #F0F9FF 100%)",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: GRADIENT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
            animation: "breathe 1.5s ease-in-out infinite",
          }}
        >
          <i className="ti ti-package" style={{ fontSize: 22, color: "#fff" }} aria-hidden="true" />
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#3730A3", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
            MaintenancePro
          </p>
          <p style={{ fontSize: 12, color: "#A5B4FC", margin: 0 }}>Loading parts inventory…</p>
        </div>
        <style>{`
          @keyframes breathe {
            0%, 100% { transform: scale(1); box-shadow: 0 8px 24px rgba(99,102,241,0.35); }
            50% { transform: scale(1.06); box-shadow: 0 12px 32px rgba(99,102,241,0.5); }
          }
        `}</style>
      </div>
    );
  }

  // ── Error state ──
  if (isError) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFF5F5",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "#FEE2E2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <i className="ti ti-alert-triangle" style={{ fontSize: 24, color: "#DC2626" }} aria-hidden="true" />
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#7F1D1D", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
            Something went wrong
          </p>
          <p style={{ fontSize: 12, color: "#EF4444", margin: 0 }}>Failed to load parts inventory</p>
        </div>
        <button
          onClick={refetch}
          style={{
            padding: "9px 20px",
            background: GRADIENT,
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <i className="ti ti-refresh" style={{ fontSize: 13 }} aria-hidden="true" />
          Try again
        </button>
      </div>
    );
  }

  // ── Main layout ──
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#F8FAFF" }}>
      <WorkOrderSidebar />
      <main style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <PartListPanel
          parts={parts}
          categories={categories}
          selectedId={effectiveId}
          onSelect={handleSelect}
          onNew={() => setNewPartOpen(true)}
          search={search}
          onSearchChange={setSearch}
          category={category}
          onCategoryChange={setCategory}
          lowStockOnly={lowStockOnly}
          onLowStockToggle={() => setLowStockOnly((v) => !v)}
        />

        {selectedPart && (
          <PartDetailPanel
            part={selectedPart}
            equipmentOptions={equipmentOptions}
          />
        )}

        <NewPartModal
          open={newPartOpen}
          onClose={() => setNewPartOpen(false)}
          categories={categories}
        />
      </main>
    </div>
  );
}

// ─── List panel ───────────────────────────────────────────────────────────────

function PartListPanel({
  parts,
  categories,
  selectedId,
  onSelect,
  onNew,
  search,
  onSearchChange,
  category,
  onCategoryChange,
  lowStockOnly,
  onLowStockToggle,
}: {
  parts: Part[];
  categories: { id: number; name: string }[];
  selectedId: number | null;
  onSelect: (p: Part) => void;
  onNew: () => void;
  search: string;
  onSearchChange: (v: string) => void;
  category: string;
  onCategoryChange: (v: string) => void;
  lowStockOnly: boolean;
  onLowStockToggle: () => void;
}) {
  return (
    <div
      style={{
        width: 420,
        borderRight: "1px solid #E5E7EB",
        display: "flex",
        flexDirection: "column",
        background: "#fff",
      }}
    >
      <div style={{ padding: "20px 20px 14px", borderBottom: "1px solid #F1F5F9" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: "#1E1B4B", margin: 0, letterSpacing: "-0.02em" }}>
            Parts Inventory
          </h1>
          <button
            onClick={onNew}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              background: GRADIENT,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
            }}
          >
            <i className="ti ti-plus" style={{ fontSize: 13 }} aria-hidden="true" />
            New Part
          </button>
        </div>

        <div style={{ position: "relative", marginBottom: 10 }}>
          <i
            className="ti ti-search"
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 14,
              color: "#9CA3AF",
            }}
            aria-hidden="true"
          />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, part #, barcode…"
            style={{
              width: "100%",
              padding: "9px 12px 9px 34px",
              borderRadius: 10,
              border: "1px solid #E5E7EB",
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            style={{
              flex: 1,
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid #E5E7EB",
              fontSize: 12.5,
              color: "#374151",
              background: "#fff",
            }}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={onLowStockToggle}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 12px",
              borderRadius: 10,
              border: `1px solid ${lowStockOnly ? "#FECACA" : "#E5E7EB"}`,
              background: lowStockOnly ? "#FEF2F2" : "#fff",
              color: lowStockOnly ? "#B91C1C" : "#6B7280",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <i className="ti ti-alert-triangle" style={{ fontSize: 13 }} aria-hidden="true" />
            Low stock
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {parts.length === 0 && (
          <div style={{ padding: 32, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
            No parts match your filters.
          </div>
        )}
        {parts.map((p) => {
          const health = STOCK_HEALTH[stockHealth(p)];
          const active = p.id === selectedId;
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "14px 20px",
                border: "none",
                borderBottom: "1px solid #F1F5F9",
                background: active ? "#F5F3FF" : "transparent",
                borderLeft: active ? "3px solid #6366F1" : "3px solid transparent",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      margin: "0 0 3px",
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: "#1E1B4B",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {p.name}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: "#9CA3AF" }}>
                    {p.partNumber || "No part #"} {p.category ? `· ${p.category}` : ""}
                  </p>
                </div>
                <span
                  style={{
                    flexShrink: 0,
                    padding: "2px 8px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    background: health.bg,
                    color: health.text,
                    border: `1px solid ${health.border}`,
                  }}
                >
                  {p.quantityOnHand} {p.unitOfMeasure}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function PartDetailPanel({
  part,
  equipmentOptions,
}: {
  part: Part;
  equipmentOptions: { id: number; name: string; assetCode?: string | null }[];
}) {
  const { data: historyData } = useGetPartStockHistoryQuery(part.id);
  const [restockPart, { isLoading: restocking }] = useRestockPartMutation();
  const [consumePart, { isLoading: consuming }] = useConsumePartMutation();
  const [adjustQuantity, { isLoading: adjusting }] = useAdjustPartQuantityMutation();
  const [linkEquipment] = useLinkPartToEquipmentMutation();
  const [unlinkEquipment] = useUnlinkPartFromEquipmentMutation();
  const [deletePart, { isLoading: deleting }] = useDeletePartMutation();

  const [restockQty, setRestockQty] = useState("");
  const [consumeQty, setConsumeQty] = useState("");
  const [adjustQty, setAdjustQty] = useState("");
  const [equipmentToLink, setEquipmentToLink] = useState("");

  const health = STOCK_HEALTH[stockHealth(part)];
  const history = historyData?.data ?? [];

  const handleRestock = async () => {
    const qty = Number(restockQty);
    if (!qty || qty <= 0) return;
    await restockPart({ id: part.id, quantity: qty, reason: "Manual restock" }).unwrap();
    setRestockQty("");
  };

  const handleConsume = async () => {
    const qty = Number(consumeQty);
    if (!qty || qty <= 0) return;
    await consumePart({ id: part.id, quantity: qty, reason: "Manual consumption" }).unwrap();
    setConsumeQty("");
  };

  const handleAdjust = async () => {
    if (adjustQty === "" || Number(adjustQty) < 0) return;
    await adjustQuantity({ id: part.id, newQuantity: Number(adjustQty), reason: "Manual count correction" }).unwrap();
    setAdjustQty("");
  };

  const handleLink = async () => {
    if (!equipmentToLink) return;
    await linkEquipment({ id: part.id, equipmentId: Number(equipmentToLink) }).unwrap();
    setEquipmentToLink("");
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${part.name}"? This can't be undone.`)) return;
    await deletePart(part.id).unwrap();
  };

  return (
    <div
      style={{
        width: 420,
        borderLeft: "1px solid #E5E7EB",
        overflowY: "auto",
        background: "#fff",
        padding: "24px 24px 40px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1E1B4B", margin: 0, letterSpacing: "-0.02em" }}>
          {part.name}
        </h2>
        <button
          onClick={handleDelete}
          disabled={deleting}
          title="Delete part"
          style={{
            border: "none",
            background: "transparent",
            color: "#DC2626",
            cursor: "pointer",
            padding: 4,
          }}
        >
          <i className="ti ti-trash" style={{ fontSize: 16 }} aria-hidden="true" />
        </button>
      </div>
      <p style={{ margin: "0 0 16px", fontSize: 12.5, color: "#9CA3AF" }}>
        {part.partNumber || "No part number"} {part.category ? `· ${part.category}` : ""}
      </p>

      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 600,
          background: health.bg,
          color: health.text,
          border: `1px solid ${health.border}`,
          marginBottom: 20,
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: health.dot }} />
        {health.label} — {part.quantityOnHand} {part.unitOfMeasure} on hand (min {part.minQuantity})
      </span>

      {/* Info grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          padding: 16,
          background: "#F8FAFF",
          borderRadius: 12,
          marginBottom: 20,
        }}
      >
        <Field label="Unit cost" value={formatCurrency(part.unitCost)} />
        <Field label="Reorder qty" value={part.reorderQuantity ? String(part.reorderQuantity) : "—"} />
        <Field label="Vendor" value={part.vendor || "—"} />
        <Field label="Vendor part #" value={part.vendorPartNumber || "—"} />
        <Field label="Location" value={part.location || "—"} />
        <Field label="Barcode" value={part.barcode || "—"} />
      </div>

      {part.description && (
        <p style={{ fontSize: 13, color: "#4B5563", marginBottom: 20, lineHeight: 1.5 }}>{part.description}</p>
      )}

      {/* Stock actions */}
      <SectionTitle>Stock actions</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        <StockActionRow
          icon="ti-square-plus"
          placeholder="Qty to add"
          value={restockQty}
          onChange={setRestockQty}
          onSubmit={handleRestock}
          loading={restocking}
          label="Restock"
          color="#16A34A"
        />
        <StockActionRow
          icon="ti-square-minus"
          placeholder="Qty to consume"
          value={consumeQty}
          onChange={setConsumeQty}
          onSubmit={handleConsume}
          loading={consuming}
          label="Consume"
          color="#DC2626"
        />
        <StockActionRow
          icon="ti-adjustments"
          placeholder="New count"
          value={adjustQty}
          onChange={setAdjustQty}
          onSubmit={handleAdjust}
          loading={adjusting}
          label="Adjust"
          color="#6366F1"
        />
      </div>

      {/* Linked equipment */}
      <SectionTitle>Linked equipment</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
        {part.linkedEquipmentIds.length === 0 && (
          <p style={{ fontSize: 12.5, color: "#9CA3AF", margin: 0 }}>No equipment linked yet.</p>
        )}
        {part.linkedEquipmentIds.map((eqId) => {
          const eq = equipmentOptions.find((e) => e.id === eqId);
          return (
            <div
              key={eqId}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 10px",
                background: "#F8FAFF",
                borderRadius: 8,
                fontSize: 12.5,
              }}
            >
              <span>{eq?.name ?? `Equipment #${eqId}`}</span>
              <button
                onClick={() => unlinkEquipment({ id: part.id, equipmentId: eqId })}
                style={{ border: "none", background: "transparent", color: "#DC2626", cursor: "pointer" }}
              >
                <i className="ti ti-x" style={{ fontSize: 13 }} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <select
          value={equipmentToLink}
          onChange={(e) => setEquipmentToLink(e.target.value)}
          style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12.5 }}
        >
          <option value="">Select equipment…</option>
          {equipmentOptions
            .filter((e) => !part.linkedEquipmentIds.includes(e.id))
            .map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
        </select>
        <button
          onClick={handleLink}
          disabled={!equipmentToLink}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: "none",
            background: "#EEF2FF",
            color: "#4338CA",
            fontSize: 12.5,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Link
        </button>
      </div>

      {/* Stock history */}
      <SectionTitle>Stock history</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {history.length === 0 && (
          <p style={{ fontSize: 12.5, color: "#9CA3AF", margin: 0 }}>No stock movements yet.</p>
        )}
        {history.map((m) => (
          <div
            key={m._id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 10px",
              borderBottom: "1px solid #F1F5F9",
              fontSize: 12.5,
            }}
          >
            <div>
              <p style={{ margin: 0, fontWeight: 600, color: "#1E1B4B", textTransform: "capitalize" }}>{m.type}</p>
              <p style={{ margin: 0, color: "#9CA3AF" }}>{m.reason || "—"}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontWeight: 600, color: m.quantityDelta >= 0 ? "#16A34A" : "#DC2626" }}>
                {m.quantityDelta >= 0 ? "+" : ""}
                {m.quantityDelta}
              </p>
              <p style={{ margin: 0, color: "#9CA3AF" }}>{formatDate(m.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ margin: "0 0 2px", fontSize: 11, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.03em" }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1E1B4B" }}>{value}</p>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontSize: 11.5,
        fontWeight: 700,
        color: "#9CA3AF",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        margin: "0 0 10px",
      }}
    >
      {children}
    </h3>
  );
}

function StockActionRow({
  icon,
  placeholder,
  value,
  onChange,
  onSubmit,
  loading,
  label,
  color,
}: {
  icon: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
  label: string;
  color: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
        <i className={`ti ${icon}`} style={{ fontSize: 15, color }} aria-hidden="true" />
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1,
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid #E5E7EB",
            fontSize: 12.5,
            outline: "none",
          }}
        />
      </div>
      <button
        onClick={onSubmit}
        disabled={loading || !value}
        style={{
          padding: "8px 14px",
          borderRadius: 8,
          border: "none",
          background: loading || !value ? "#E5E7EB" : `${color}15`,
          color: loading || !value ? "#9CA3AF" : color,
          fontSize: 12.5,
          fontWeight: 600,
          cursor: loading || !value ? "default" : "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </button>
    </div>
  );
}

// ─── New part modal ───────────────────────────────────────────────────────────

function NewPartModal({
  open,
  onClose,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  categories: { id: number; name: string }[];
}) {
  const [form, setForm] = useState<CreatePartInput>(EMPTY_PART_FORM);
  const [createPart, { isLoading }] = useCreatePartMutation();

  if (!open) return null;

  const set = <K extends keyof CreatePartInput>(key: K, value: CreatePartInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    await createPart(form).unwrap();
    setForm(EMPTY_PART_FORM);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(30,27,75,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        style={{
          width: 460,
          maxHeight: "85vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 20px 60px rgba(30,27,75,0.25)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1E1B4B", margin: 0 }}>New Part</h2>
          <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer" }}>
            <i className="ti ti-x" style={{ fontSize: 16, color: "#9CA3AF" }} aria-hidden="true" />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <ModalInput label="Name *" value={form.name} onChange={(v) => set("name", v)} />
          <ModalInput label="Part number" value={form.partNumber ?? ""} onChange={(v) => set("partNumber", v || null)} />

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
              Category
            </label>
            <select
              value={form.category ?? ""}
              onChange={(e) => set("category", e.target.value || null)}
              style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13 }}
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <ModalInput
              label="Initial qty"
              type="number"
              value={String(form.quantityOnHand ?? 0)}
              onChange={(v) => set("quantityOnHand", Number(v) || 0)}
            />
            <ModalInput
              label="Unit"
              value={form.unitOfMeasure ?? "pcs"}
              onChange={(v) => set("unitOfMeasure", v)}
            />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <ModalInput
              label="Min quantity"
              type="number"
              value={String(form.minQuantity ?? 0)}
              onChange={(v) => set("minQuantity", Number(v) || 0)}
            />
            <ModalInput
              label="Unit cost"
              type="number"
              value={String(form.unitCost ?? 0)}
              onChange={(v) => set("unitCost", Number(v) || 0)}
            />
          </div>

          <ModalInput label="Vendor" value={form.vendor ?? ""} onChange={(v) => set("vendor", v || null)} />
          <ModalInput label="Location" value={form.location ?? ""} onChange={(v) => set("location", v || null)} />
          <ModalInput label="Barcode" value={form.barcode ?? ""} onChange={(v) => set("barcode", v || null)} />

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
              Description
            </label>
            <textarea
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value || null)}
              rows={3}
              style={{
                width: "100%",
                padding: "9px 10px",
                borderRadius: 8,
                border: "1px solid #E5E7EB",
                fontSize: 13,
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 16px",
              borderRadius: 10,
              border: "1px solid #E5E7EB",
              background: "#fff",
              color: "#374151",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !form.name.trim()}
            style={{
              padding: "9px 16px",
              borderRadius: 10,
              border: "none",
              background: GRADIENT,
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: isLoading ? "default" : "pointer",
              opacity: isLoading || !form.name.trim() ? 0.6 : 1,
            }}
          >
            {isLoading ? "Creating…" : "Create Part"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div style={{ flex: 1 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "9px 10px",
          borderRadius: 8,
          border: "1px solid #E5E7EB",
          fontSize: 13,
          outline: "none",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}