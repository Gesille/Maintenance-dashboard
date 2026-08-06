/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useMemo, useState } from "react";
import { WorkOrderSidebar } from "@/component/Sidebar";

import { useGetAllCategoriesQuery } from "@/redux/Category/Categoryapi";
import { useGetAllEquipmentQuery } from "@/redux/Equipment/Equipmentapi";

import { Part, EMPTY_PART_FORM } from "@/types/Part";
import {
  useGetAllPartsQuery,
  useGetPartStockHistoryQuery,
  useRestockPartMutation,
  useConsumePartMutation,
  useAdjustPartQuantityMutation,
  useLinkPartToEquipmentMutation,
  useUnlinkPartFromEquipmentMutation,
  useDeletePartMutation,
  CreatePartInput,
  useCreatePartMutation,
} from "@/redux/Part/Partapi";

// ─── Design tokens ──────────────────────────────────────────────────────────
// Deliberately not a purple-gradient SaaS template: this is an operations
// screen people scan quickly, so color is functional (status), not decorative.

const COLOR = {
  bg: "#F7F8FA",
  surface: "#FFFFFF",
  border: "#E5E7EB",
  borderSubtle: "#F1F2F4",
  textPrimary: "#14181F",
  textSecondary: "#667085",
  textTertiary: "#9CA3AF",
  accent: "#2A6F63", // deep teal — used sparingly, for primary actions only
  accentSurface: "#EDF5F3",
  danger: "#B42318",
  dangerSurface: "#FEF3F2",
  dangerBorder: "#FDA29B",
  success: "#067647",
  successSurface: "#ECFDF3",
  successBorder: "#ABEFC6",
};

const MONO =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace';

const STOCK_HEALTH = {
  low: { label: "Low stock", bg: COLOR.dangerSurface, text: COLOR.danger, border: COLOR.dangerBorder, dot: "#EF4444" },
  ok: { label: "In stock", bg: COLOR.successSurface, text: COLOR.success, border: COLOR.successBorder, dot: "#22C55E" },
} as const;

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

function initials(name: string): string {
  return (
    name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "PT"
  );
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

  // Independent of the active filters, so the low-stock count is always
  // accurate even when the user is searching or filtering something else.
  const { data: lowStockData, refetch: refetchLowStock } = useGetAllPartsQuery({
    lowStockOnly: true,
  });

  const { data: categoryData } = useGetAllCategoriesQuery();
  const { data: equipmentData } = useGetAllEquipmentQuery();

  const parts = data?.data ?? [];
  const lowStockParts = lowStockData?.data ?? [];
  const categories = categoryData?.data ?? [];
  const equipmentOptions = useMemo(
    () => (equipmentData?.data ?? []).filter((e: any) => e.active !== false),
    [equipmentData],
  );

  const effectiveId = selectedId ?? parts[0]?.id ?? null;
  const selectedPart = parts.find((p) => p.id === effectiveId) ?? null;

  const handleSelect = useCallback((p: Part) => setSelectedId(p.id), []);

  // Called by the detail panel / modal after any mutation succeeds, so the
  // list and the low-stock banner both stay in sync without a manual reload.
  const handleDataChanged = useCallback(() => {
    refetch();
    refetchLowStock();
  }, [refetch, refetchLowStock]);

  const handlePartDeleted = useCallback(
    (id: number) => {
      setSelectedId((current) => (current === id ? null : current));
      handleDataChanged();
    },
    [handleDataChanged],
  );

  // ── Loading state ──
  if (isLoading) {
    return (
      <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: COLOR.bg }}>
        <WorkOrderSidebar />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                border: `2px solid ${COLOR.border}`,
                borderTopColor: COLOR.accent,
                animation: "spin 0.7s linear infinite",
              }}
            />
            <p style={{ fontSize: 13, color: COLOR.textSecondary, margin: 0 }}>Loading parts inventory…</p>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Error state ──
  if (isError) {
    return (
      <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: COLOR.bg }}>
        <WorkOrderSidebar />
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
          }}
        >
          <i className="ti ti-alert-triangle" style={{ fontSize: 22, color: COLOR.danger }} aria-hidden="true" />
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: COLOR.textPrimary, margin: "0 0 4px" }}>
              Couldn&apos;t load parts inventory
            </p>
            <p style={{ fontSize: 12.5, color: COLOR.textSecondary, margin: 0 }}>
              Check your connection and try again.
            </p>
          </div>
          <button onClick={refetch} style={buttonStyle("primary")}>
            <i className="ti ti-refresh" style={{ fontSize: 13 }} aria-hidden="true" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  // ── Main layout ──
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: COLOR.bg }}>
      <WorkOrderSidebar />
      <main style={{ flex: 1, display: "flex", overflow: "hidden", minWidth: 0 }}>
        <PartListPanel
          parts={parts}
          lowStockCount={lowStockParts.length}
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

        {selectedPart ? (
          <PartDetailPanel
            key={selectedPart.id}
            part={selectedPart}
            equipmentOptions={equipmentOptions}
            onChanged={handleDataChanged}
            onDeleted={handlePartDeleted}
          />
        ) : (
          <EmptyDetailState />
        )}

        <NewPartModal
          open={newPartOpen}
          onClose={() => setNewPartOpen(false)}
          categories={categories}
          onCreated={handleDataChanged}
        />
      </main>
    </div>
  );
}

// ─── Shared button style helper ────────────────────────────────────────────

function buttonStyle(variant: "primary" | "secondary" | "danger" | "ghost"): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 14px",
    borderRadius: 8,
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer",
    border: "1px solid transparent",
  };
  switch (variant) {
    case "primary":
      return { ...base, background: COLOR.accent, color: "#fff" };
    case "danger":
      return { ...base, background: COLOR.dangerSurface, color: COLOR.danger, border: `1px solid ${COLOR.dangerBorder}` };
    case "ghost":
      return { ...base, background: "transparent", color: COLOR.textSecondary, border: `1px solid ${COLOR.border}` };
    default:
      return { ...base, background: COLOR.surface, color: COLOR.textPrimary, border: `1px solid ${COLOR.border}` };
  }
}

// ─── List panel ───────────────────────────────────────────────────────────────

function PartListPanel({
  parts,
  lowStockCount,
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
  lowStockCount: number;
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
        width: 380,
        flexShrink: 0,
        borderRight: `1px solid ${COLOR.border}`,
        display: "flex",
        flexDirection: "column",
        background: COLOR.surface,
      }}
    >
      <div style={{ padding: "20px 20px 14px", borderBottom: `1px solid ${COLOR.borderSubtle}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 700, color: COLOR.textPrimary, margin: 0 }}>Parts Inventory</h1>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: COLOR.textTertiary }}>
              {parts.length} {parts.length === 1 ? "part" : "parts"} shown
            </p>
          </div>
          <button onClick={onNew} style={buttonStyle("primary")}>
            <i className="ti ti-plus" style={{ fontSize: 13 }} aria-hidden="true" />
            New part
          </button>
        </div>

        {/* Persistent low-stock alert — always visible, independent of filters */}
        {lowStockCount > 0 && (
          <button
            onClick={onLowStockToggle}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              marginBottom: 12,
              borderRadius: 8,
              border: `1px solid ${COLOR.dangerBorder}`,
              background: COLOR.dangerSurface,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 600, color: COLOR.danger }}>
              <i className="ti ti-alert-triangle" style={{ fontSize: 14 }} aria-hidden="true" />
              {lowStockCount} {lowStockCount === 1 ? "part is" : "parts are"} below minimum
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: COLOR.danger, textDecoration: lowStockOnly ? "none" : "underline" }}>
              {lowStockOnly ? "Showing" : "View"}
            </span>
          </button>
        )}

        <div style={{ position: "relative", marginBottom: 10 }}>
          <i
            className="ti ti-search"
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: COLOR.textTertiary }}
            aria-hidden="true"
          />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, part #, barcode…"
            style={{
              width: "100%",
              padding: "9px 12px 9px 34px",
              borderRadius: 8,
              border: `1px solid ${COLOR.border}`,
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
              background: COLOR.bg,
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
              borderRadius: 8,
              border: `1px solid ${COLOR.border}`,
              fontSize: 12.5,
              color: COLOR.textPrimary,
              background: COLOR.surface,
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
              borderRadius: 8,
              border: `1px solid ${lowStockOnly ? COLOR.dangerBorder : COLOR.border}`,
              background: lowStockOnly ? COLOR.dangerSurface : COLOR.surface,
              color: lowStockOnly ? COLOR.danger : COLOR.textSecondary,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <i className="ti ti-filter" style={{ fontSize: 13 }} aria-hidden="true" />
            Low stock
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {parts.length === 0 && (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <i className="ti ti-package-off" style={{ fontSize: 24, color: COLOR.textTertiary }} aria-hidden="true" />
            <p style={{ fontSize: 13, color: COLOR.textSecondary, margin: "10px 0 0" }}>No parts match your filters.</p>
          </div>
        )}
        {parts.map((p) => {
          const health = STOCK_HEALTH[stockHealth(p)];
          const active = p.id === selectedId;
          const low = p.isLowStock;
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "13px 20px 13px 17px",
                border: "none",
                borderBottom: `1px solid ${COLOR.borderSubtle}`,
                background: active ? COLOR.accentSurface : "transparent",
                borderLeft: `3px solid ${active ? COLOR.accent : low ? health.dot : "transparent"}`,
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
                      color: COLOR.textPrimary,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {p.name}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: COLOR.textTertiary, fontFamily: MONO }}>
                    {p.partNumber || "No part #"} {p.category ? `· ${p.category}` : ""}
                  </p>
                </div>
                <span
                  style={{
                    flexShrink: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "3px 9px",
                    borderRadius: 6,
                    fontSize: 11.5,
                    fontWeight: 700,
                    fontFamily: MONO,
                    background: health.bg,
                    color: health.text,
                    border: `1px solid ${health.border}`,
                  }}
                >
                  {low && <span style={{ width: 5, height: 5, borderRadius: "50%", background: health.dot }} />}
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

// ─── Empty detail state (shown when nothing is selected) ─────────────────────

function EmptyDetailState() {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: COLOR.surface,
        gap: 10,
      }}
    >
      <i className="ti ti-package" style={{ fontSize: 26, color: COLOR.textTertiary }} aria-hidden="true" />
      <p style={{ fontSize: 14, fontWeight: 600, color: COLOR.textPrimary, margin: 0 }}>Select a part</p>
      <p style={{ fontSize: 12.5, color: COLOR.textTertiary, margin: 0 }}>Choose a part from the list to see its details.</p>
    </div>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function PartDetailPanel({
  part,
  equipmentOptions,
  onChanged,
  onDeleted,
}: {
  part: Part;
  equipmentOptions: { id: number; name: string; assetCode?: string | null }[];
  onChanged: () => void;
  onDeleted: (id: number) => void;
}) {
  const { data: historyData, refetch: refetchHistory } = useGetPartStockHistoryQuery(part.id);
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
  const stockValue = part.unitCost * part.quantityOnHand;

  // Every mutation below refetches both the stock history and the parent's
  // parts list (and low-stock banner) on success, so quantities update
  // immediately instead of waiting on a manual page reload.

  const handleRestock = async () => {
    const qty = Number(restockQty);
    if (!qty || qty <= 0) return;
    await restockPart({ id: part.id, quantity: qty, reason: "Manual restock" }).unwrap();
    setRestockQty("");
    refetchHistory();
    onChanged();
  };

  const handleConsume = async () => {
    const qty = Number(consumeQty);
    if (!qty || qty <= 0) return;
    await consumePart({ id: part.id, quantity: qty, reason: "Manual consumption" }).unwrap();
    setConsumeQty("");
    refetchHistory();
    onChanged();
  };

  const handleAdjust = async () => {
    if (adjustQty === "" || Number(adjustQty) < 0) return;
    await adjustQuantity({ id: part.id, newQuantity: Number(adjustQty), reason: "Manual count correction" }).unwrap();
    setAdjustQty("");
    refetchHistory();
    onChanged();
  };

  const handleLink = async () => {
    if (!equipmentToLink) return;
    await linkEquipment({ id: part.id, equipmentId: Number(equipmentToLink) }).unwrap();
    setEquipmentToLink("");
    onChanged();
  };

  const handleUnlink = async (equipmentId: number) => {
    await unlinkEquipment({ id: part.id, equipmentId }).unwrap();
    onChanged();
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${part.name}"? This can't be undone.`)) return;
    await deletePart(part.id).unwrap();
    onDeleted(part.id);
  };

  return (
    <div style={{ flex: 1, minWidth: 0, overflowY: "auto", background: COLOR.surface }}>
      {/* Header band */}
      <div
        style={{
          padding: "22px 40px",
          borderBottom: `1px solid ${COLOR.borderSubtle}`,
          display: "flex",
          alignItems: "flex-start",
          gap: 16,
          position: "sticky",
          top: 0,
          background: COLOR.surface,
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            background: COLOR.accentSurface,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            color: COLOR.accent,
          }}
        >
          {initials(part.name)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: COLOR.textPrimary, margin: 0 }}>{part.name}</h2>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 10px",
                borderRadius: 999,
                fontSize: 11.5,
                fontWeight: 600,
                background: health.bg,
                color: health.text,
                border: `1px solid ${health.border}`,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: health.dot }} />
              {health.label}
            </span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 12.5, color: COLOR.textTertiary, fontFamily: MONO }}>
            {part.partNumber || "No part number"} {part.category ? `· ${part.category}` : ""}
          </p>
        </div>

        <button onClick={handleDelete} disabled={deleting} style={buttonStyle("danger")}>
          <i className="ti ti-trash" style={{ fontSize: 14 }} aria-hidden="true" />
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>

      {/* Stat strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 1,
          background: COLOR.borderSubtle,
          borderBottom: `1px solid ${COLOR.borderSubtle}`,
        }}
      >
        <StatCell label="On hand" value={`${part.quantityOnHand} ${part.unitOfMeasure}`} accent={health.text} />
        <StatCell label="Minimum" value={String(part.minQuantity)} />
        <StatCell label="Unit cost" value={formatCurrency(part.unitCost)} />
        <StatCell label="Stock value" value={formatCurrency(stockValue)} />
      </div>

      {/* Two-column body */}
      <div
        style={{
          padding: "26px 40px 48px",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)",
          gap: 40,
          alignItems: "start",
        }}
      >
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 26, minWidth: 0 }}>
          <div>
            <SectionTitle>Details</SectionTitle>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 14,
                padding: 16,
                background: COLOR.bg,
                border: `1px solid ${COLOR.borderSubtle}`,
                borderRadius: 10,
              }}
            >
              <Field label="Reorder qty" value={part.reorderQuantity ? String(part.reorderQuantity) : "—"} />
              <Field label="Vendor" value={part.vendor || "—"} />
              <Field label="Vendor part #" value={part.vendorPartNumber || "—"} />
              <Field label="Location" value={part.location || "—"} />
              <Field label="Barcode" value={part.barcode || "—"} />
              <Field label="Unit" value={part.unitOfMeasure} />
            </div>
            {part.description && (
              <p style={{ fontSize: 13, color: COLOR.textSecondary, marginTop: 14, lineHeight: 1.6 }}>{part.description}</p>
            )}
          </div>

          <div>
            <SectionTitle>Stock actions</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <StockActionRow
                icon="ti-square-plus"
                placeholder="Qty to add"
                value={restockQty}
                onChange={setRestockQty}
                onSubmit={handleRestock}
                loading={restocking}
                label="Restock"
                color={COLOR.success}
              />
              <StockActionRow
                icon="ti-square-minus"
                placeholder="Qty to consume"
                value={consumeQty}
                onChange={setConsumeQty}
                onSubmit={handleConsume}
                loading={consuming}
                label="Consume"
                color={COLOR.danger}
              />
              <StockActionRow
                icon="ti-adjustments"
                placeholder="New count"
                value={adjustQty}
                onChange={setAdjustQty}
                onSubmit={handleAdjust}
                loading={adjusting}
                label="Adjust"
                color={COLOR.accent}
              />
            </div>
          </div>

          <div>
            <SectionTitle>Stock history</SectionTitle>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                border: `1px solid ${COLOR.borderSubtle}`,
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              {history.length === 0 && (
                <p style={{ fontSize: 12.5, color: COLOR.textTertiary, margin: 0, padding: 16 }}>No stock movements yet.</p>
              )}
              {history.map((m, i) => (
                <div
                  key={m._id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    borderTop: i === 0 ? "none" : `1px solid ${COLOR.borderSubtle}`,
                    fontSize: 12.5,
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, color: COLOR.textPrimary, textTransform: "capitalize" }}>{m.type}</p>
                    <p style={{ margin: 0, color: COLOR.textTertiary }}>{m.reason || "—"}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: 0, fontWeight: 700, fontFamily: MONO, color: m.quantityDelta >= 0 ? COLOR.success : COLOR.danger }}>
                      {m.quantityDelta >= 0 ? "+" : ""}
                      {m.quantityDelta}
                    </p>
                    <p style={{ margin: 0, color: COLOR.textTertiary }}>{formatDate(m.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 26, minWidth: 0 }}>
          <div>
            <SectionTitle>Linked equipment</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
              {part.linkedEquipmentIds.length === 0 && (
                <div style={{ padding: 16, border: `1px dashed ${COLOR.border}`, borderRadius: 10, textAlign: "center" }}>
                  <p style={{ fontSize: 12.5, color: COLOR.textTertiary, margin: 0 }}>No equipment linked yet.</p>
                </div>
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
                      padding: "10px 12px",
                      background: COLOR.bg,
                      border: `1px solid ${COLOR.borderSubtle}`,
                      borderRadius: 8,
                      fontSize: 12.5,
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <i className="ti ti-tool" style={{ fontSize: 13, color: COLOR.accent }} aria-hidden="true" />
                      {eq?.name ?? `Equipment #${eqId}`}
                    </span>
                    <button
                      onClick={() => handleUnlink(eqId)}
                      style={{ border: "none", background: "transparent", color: COLOR.textTertiary, cursor: "pointer" }}
                    >
                      <i className="ti ti-x" style={{ fontSize: 13 }} aria-hidden="true" />
                    </button>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <select
                value={equipmentToLink}
                onChange={(e) => setEquipmentToLink(e.target.value)}
                style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: `1px solid ${COLOR.border}`, fontSize: 12.5 }}
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
                  background: equipmentToLink ? COLOR.accentSurface : COLOR.borderSubtle,
                  color: equipmentToLink ? COLOR.accent : COLOR.textTertiary,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: equipmentToLink ? "pointer" : "default",
                }}
              >
                Link
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCell({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ background: COLOR.surface, padding: "14px 20px" }}>
      <p style={{ margin: "0 0 4px", fontSize: 10.5, color: COLOR.textTertiary, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: 15, fontWeight: 700, fontFamily: MONO, color: accent ?? COLOR.textPrimary }}>{value}</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ margin: "0 0 2px", fontSize: 11, color: COLOR.textTertiary, textTransform: "uppercase", letterSpacing: "0.03em" }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: COLOR.textPrimary }}>{value}</p>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontSize: 11.5,
        fontWeight: 700,
        color: COLOR.textTertiary,
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
            border: `1px solid ${COLOR.border}`,
            fontSize: 12.5,
            outline: "none",
            fontFamily: MONO,
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
          background: loading || !value ? COLOR.borderSubtle : `${color}18`,
          color: loading || !value ? COLOR.textTertiary : color,
          fontSize: 12.5,
          fontWeight: 600,
          cursor: loading || !value ? "default" : "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {loading ? "Saving…" : label}
      </button>
    </div>
  );
}

// ─── New part modal ───────────────────────────────────────────────────────────

function NewPartModal({
  open,
  onClose,
  categories,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  categories: { id: number; name: string }[];
  onCreated: () => void;
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
    onCreated();
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20,24,31,0.45)",
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
          background: COLOR.surface,
          borderRadius: 14,
          padding: 24,
          boxShadow: "0 20px 50px rgba(20,24,31,0.25)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: COLOR.textPrimary, margin: 0 }}>New Part</h2>
          <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer" }}>
            <i className="ti ti-x" style={{ fontSize: 16, color: COLOR.textTertiary }} aria-hidden="true" />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <ModalInput label="Name *" value={form.name} onChange={(v) => set("name", v)} />
          <ModalInput label="Part number" value={form.partNumber ?? ""} onChange={(v) => set("partNumber", v || null)} />

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLOR.textSecondary, display: "block", marginBottom: 4 }}>
              Category
            </label>
            <select
              value={form.category ?? ""}
              onChange={(e) => set("category", e.target.value || null)}
              style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: `1px solid ${COLOR.border}`, fontSize: 13 }}
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
            <ModalInput label="Unit" value={form.unitOfMeasure ?? "pcs"} onChange={(v) => set("unitOfMeasure", v)} />
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
            <label style={{ fontSize: 12, fontWeight: 600, color: COLOR.textSecondary, display: "block", marginBottom: 4 }}>
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
                border: `1px solid ${COLOR.border}`,
                fontSize: 13,
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={buttonStyle("ghost")}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !form.name.trim()}
            style={{ ...buttonStyle("primary"), opacity: isLoading || !form.name.trim() ? 0.6 : 1 }}
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
      <label style={{ fontSize: 12, fontWeight: 600, color: COLOR.textSecondary, display: "block", marginBottom: 4 }}>
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
          border: `1px solid ${COLOR.border}`,
          fontSize: 13,
          outline: "none",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}