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
import { CATEGORY_COLORS } from "@/types/tokens";

// ─── Design tokens ──────────────────────────────────────────────────────────
// Same neutral base as before, but paired with a small set of saturated
// accents (indigo / amber / violet / teal) so status, category, and stat
// data read at a glance instead of everything sharing one gray-and-teal look.

const COLOR = {
  bg: "#F8FAFF",
  surface: "#FFFFFF",
  border: "#E5E7EB",
  borderSubtle: "#F1F2F4",
  textPrimary: "#14181F",
  textSecondary: "#667085",
  textTertiary: "#9CA3AF",
  accent: "#6366F1",
  accentDeep: "#8B5CF6",
  accentSurface: "#EEF2FF",
  accentBorder: "#C7D2FE",
  danger: "#B42318",
  dangerSurface: "#FEF3F2",
  dangerBorder: "#FDA29B",
  success: "#067647",
  successSurface: "#ECFDF3",
  successBorder: "#ABEFC6",
} as const;

const MONO =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace';

const STOCK_HEALTH = {
  low: { label: "Low stock", bg: COLOR.dangerSurface, text: COLOR.danger, border: COLOR.dangerBorder, dot: "#EF4444" },
  ok: { label: "In stock", bg: COLOR.successSurface, text: COLOR.success, border: COLOR.successBorder, dot: "#22C55E" },
} as const;

// Distinct tinted accent per stat cell so the strip reads as data, not a
// wall of gray — mirrors the way status/priority chips work elsewhere.
const STAT_ACCENTS = {
  onHand: { text: "#3730A3", bg: "#EEF2FF", border: "#C7D2FE" },
  minimum: { text: "#92400E", bg: "#FFFBEB", border: "#FDE68A" },
  unitCost: { text: "#6D28D9", bg: "#F5F3FF", border: "#DDD6FE" },
  stockValue: { text: "#0F766E", bg: "#F0FDFA", border: "#99F6E4" },
} as const;

const DEFAULT_CATEGORY_COLOR = { bg: "#F9FAFB", text: "#374151" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function stockHealth(part: Part): keyof typeof STOCK_HEALTH {
  return part.isLowStock ? "low" : "ok";
}

function categoryStyle(name?: string | null) {
  if (!name) return DEFAULT_CATEGORY_COLOR;
  return CATEGORY_COLORS[name] ?? DEFAULT_CATEGORY_COLOR;
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
            background: `linear-gradient(135deg, ${COLOR.accent} 0%, ${COLOR.accentDeep} 100%)`,
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
            Parts Inventory
          </p>
          <p style={{ fontSize: 12, color: "#A5B4FC", margin: 0 }}>Loading parts…</p>
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

  if (isError) {
    return (
      <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#FFF5F5" }}>
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
    whiteSpace: "nowrap",
    flexShrink: 0,
  };
  switch (variant) {
    case "primary":
      return {
        ...base,
        background: `linear-gradient(135deg, ${COLOR.accent} 0%, ${COLOR.accentDeep} 100%)`,
        color: "#fff",
        boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
      };
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
        width: 340,
        flexShrink: 0,
        borderRight: `1px solid ${COLOR.border}`,
        display: "flex",
        flexDirection: "column",
        background: COLOR.surface,
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "20px 18px 14px", borderBottom: `1px solid ${COLOR.borderSubtle}` }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
          <div style={{ minWidth: 0 }}>
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

        {lowStockCount > 0 && (
          <button
            onClick={onLowStockToggle}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              padding: "10px 12px",
              marginBottom: 12,
              borderRadius: 8,
              border: `1px solid ${COLOR.dangerBorder}`,
              background: COLOR.dangerSurface,
              cursor: "pointer",
              textAlign: "left",
              boxSizing: "border-box",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, color: COLOR.danger, minWidth: 0 }}>
              <i className="ti ti-alert-triangle" style={{ fontSize: 14, flexShrink: 0 }} aria-hidden="true" />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {lowStockCount} {lowStockCount === 1 ? "part is" : "parts are"} low stock
              </span>
            </span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: COLOR.danger, textDecoration: lowStockOnly ? "none" : "underline", flexShrink: 0 }}>
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
              minWidth: 0,
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
              flexShrink: 0,
            }}
          >
            <i className="ti ti-filter" style={{ fontSize: 13 }} aria-hidden="true" />
            Low stock
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
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
          const catStyle = categoryStyle(p.category);
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "13px 16px 13px 15px",
                border: "none",
                borderBottom: `1px solid ${COLOR.borderSubtle}`,
                background: active ? COLOR.accentSurface : "transparent",
                borderLeft: `3px solid ${active ? COLOR.accent : low ? health.dot : "transparent"}`,
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: catStyle.bg,
                      color: catStyle.text,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10.5,
                      fontWeight: 700,
                    }}
                  >
                    {initials(p.name)}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
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
                    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          color: COLOR.textTertiary,
                          fontFamily: MONO,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {p.partNumber || "No part #"}
                      </p>
                      {p.category && (
                        <span
                          style={{
                            flexShrink: 0,
                            fontSize: 10.5,
                            fontWeight: 700,
                            padding: "1px 7px",
                            borderRadius: 999,
                            background: catStyle.bg,
                            color: catStyle.text,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {p.category}
                        </span>
                      )}
                    </div>
                  </div>
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
                    whiteSpace: "nowrap",
                  }}
                >
                  {low && <span style={{ width: 5, height: 5, borderRadius: "50%", background: health.dot, flexShrink: 0 }} />}
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

// ─── Empty detail state ────────────────────────────────────────────────────────

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
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: COLOR.accentSurface,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <i className="ti ti-package" style={{ fontSize: 20, color: COLOR.accent }} aria-hidden="true" />
      </div>
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
  const [confirmDelete, setConfirmDelete] = useState(false);

  const healthKey = stockHealth(part);
  const health = STOCK_HEALTH[healthKey];
  const isLow = healthKey === "low";
  const history = historyData?.data ?? [];
  const stockValue = part.unitCost * part.quantityOnHand;
  const catStyle = categoryStyle(part.category);

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
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await deletePart(part.id).unwrap();
    onDeleted(part.id);
  };

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        maxWidth: "100%",
        overflowY: "auto",
        overflowX: "hidden",
        background: COLOR.surface,
      }}
    >
      {/* Header band */}
      <div
        style={{
          padding: "20px 28px",
          borderBottom: `1px solid ${COLOR.borderSubtle}`,
          display: "flex",
          alignItems: "flex-start",
          gap: 14,
          position: "sticky",
          top: 0,
          background: COLOR.surface,
          zIndex: 1,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            background: catStyle.bg,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            color: catStyle.text,
          }}
        >
          {initials(part.name)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: COLOR.textPrimary,
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "100%",
              }}
            >
              {part.name}
            </h2>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 10px",
                borderRadius: 999,
                fontSize: 11.5,
                fontWeight: 700,
                background: health.bg,
                color: health.text,
                border: `1px solid ${health.border}`,
                flexShrink: 0,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: health.dot, flexShrink: 0 }} />
              {health.label}
            </span>
            {part.category && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "3px 10px",
                  borderRadius: 999,
                  fontSize: 11.5,
                  fontWeight: 700,
                  background: catStyle.bg,
                  color: catStyle.text,
                  flexShrink: 0,
                }}
              >
                {part.category}
              </span>
            )}
          </div>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 12.5,
              color: COLOR.textTertiary,
              fontFamily: MONO,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {part.partNumber || "No part number"}
          </p>
        </div>

        <button
          onClick={handleDelete}
          onBlur={() => setConfirmDelete(false)}
          disabled={deleting}
          style={{ ...buttonStyle("danger"), opacity: deleting ? 0.6 : 1 }}
        >
          <i className="ti ti-trash" style={{ fontSize: 14 }} aria-hidden="true" />
          {deleting ? "Deleting…" : confirmDelete ? "Confirm delete?" : "Delete"}
        </button>
      </div>

      {/* Stat strip — each cell gets its own accent so the row reads as data */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 10,
          padding: "14px 28px",
          borderBottom: `1px solid ${COLOR.borderSubtle}`,
          boxSizing: "border-box",
        }}
      >
        <StatCell label="On hand" value={`${part.quantityOnHand} ${part.unitOfMeasure}`} accent={STAT_ACCENTS.onHand} warning={isLow} />
        <StatCell label="Minimum" value={String(part.minQuantity)} accent={STAT_ACCENTS.minimum} />
        <StatCell label="Unit cost" value={formatCurrency(part.unitCost)} accent={STAT_ACCENTS.unitCost} />
        <StatCell label="Stock value" value={formatCurrency(stockValue)} accent={STAT_ACCENTS.stockValue} />
      </div>

      {/* Two-column body */}
      <div
        style={{
          padding: "24px 28px 48px",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)",
          gap: 28,
          alignItems: "start",
          boxSizing: "border-box",
          maxWidth: "100%",
        }}
      >
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24, minWidth: 0 }}>
          <div style={{ minWidth: 0 }}>
            <SectionTitle>Details</SectionTitle>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
                gap: 14,
                padding: 16,
                background: COLOR.bg,
                border: `1px solid ${COLOR.borderSubtle}`,
                borderRadius: 10,
                boxSizing: "border-box",
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
              <p style={{ fontSize: 13, color: COLOR.textSecondary, marginTop: 14, lineHeight: 1.6, wordBreak: "break-word" }}>
                {part.description}
              </p>
            )}
          </div>

          <div style={{ minWidth: 0 }}>
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

          <div style={{ minWidth: 0 }}>
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
                    gap: 10,
                    padding: "12px 16px",
                    borderTop: i === 0 ? "none" : `1px solid ${COLOR.borderSubtle}`,
                    fontSize: 12.5,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 600, color: COLOR.textPrimary, textTransform: "capitalize" }}>{m.type}</p>
                    <p
                      style={{
                        margin: 0,
                        color: COLOR.textTertiary,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {m.reason || "—"}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 700,
                        fontFamily: MONO,
                        color: m.quantityDelta >= 0 ? COLOR.success : COLOR.danger,
                      }}
                    >
                      {m.quantityDelta >= 0 ? "+" : ""}
                      {m.quantityDelta}
                    </p>
                    <p style={{ margin: 0, color: COLOR.textTertiary, whiteSpace: "nowrap" }}>{formatDate(m.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24, minWidth: 0 }}>
          <div style={{ minWidth: 0 }}>
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
                      gap: 8,
                      padding: "10px 12px",
                      background: COLOR.bg,
                      border: `1px solid ${COLOR.borderSubtle}`,
                      borderRadius: 8,
                      fontSize: 12.5,
                      minWidth: 0,
                      boxSizing: "border-box",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
                      <i className="ti ti-tool" style={{ fontSize: 13, color: COLOR.accent, flexShrink: 0 }} aria-hidden="true" />
                      <span
                        title={eq?.name ?? `Equipment #${eqId}`}
                        style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      >
                        {eq?.name ?? `Equipment #${eqId}`}
                      </span>
                    </span>
                    <button
                      onClick={() => handleUnlink(eqId)}
                      style={{ border: "none", background: "transparent", color: COLOR.textTertiary, cursor: "pointer", flexShrink: 0, padding: 2, display: "flex" }}
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
                style={{ flex: 1, minWidth: 0, padding: "8px 10px", borderRadius: 8, border: `1px solid ${COLOR.border}`, fontSize: 12.5 }}
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
                  border: `1px solid ${equipmentToLink ? COLOR.accentBorder : COLOR.borderSubtle}`,
                  background: equipmentToLink ? COLOR.accentSurface : COLOR.borderSubtle,
                  color: equipmentToLink ? COLOR.accent : COLOR.textTertiary,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: equipmentToLink ? "pointer" : "default",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
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

function StatCell({
  label,
  value,
  accent,
  warning,
}: {
  label: string;
  value: string;
  accent: { text: string; bg: string; border: string };
  warning?: boolean;
}) {
  const bg = warning ? COLOR.dangerSurface : accent.bg;
  const text = warning ? COLOR.danger : accent.text;
  const border = warning ? COLOR.dangerBorder : accent.border;
  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 10,
        padding: "12px 16px",
        minWidth: 0,
      }}
    >
      <p
        style={{
          margin: "0 0 4px",
          fontSize: 10.5,
          color: text,
          opacity: warning ? 1 : 0.85,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontWeight: warning ? 700 : 600,
        }}
      >
        {warning && <i className="ti ti-alert-triangle" style={{ fontSize: 11 }} aria-hidden="true" />}
        {label}
      </p>
      <p
        style={{
          margin: 0,
          fontSize: 15,
          fontWeight: 700,
          fontFamily: MONO,
          color: text,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <p style={{ margin: "0 0 2px", fontSize: 11, color: COLOR.textTertiary, textTransform: "uppercase", letterSpacing: "0.03em" }}>
        {label}
      </p>
      <p
        title={value}
        style={{
          margin: 0,
          fontSize: 13,
          fontWeight: 600,
          color: COLOR.textPrimary,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontSize: 11.5,
        fontWeight: 700,
        color: COLOR.accent,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        margin: "0 0 10px",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span style={{ width: 3, height: 12, borderRadius: 2, background: COLOR.accent, display: "inline-block" }} />
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
  const disabled = loading || !value || Number(value) <= 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
        <i className={`ti ${icon}`} style={{ fontSize: 15, color, flexShrink: 0 }} aria-hidden="true" />
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !disabled && onSubmit()}
          placeholder={placeholder}
          style={{
            flex: 1,
            minWidth: 0,
            padding: "8px 10px",
            borderRadius: 8,
            border: `1px solid ${COLOR.border}`,
            fontSize: 12.5,
            outline: "none",
            fontFamily: MONO,
            boxSizing: "border-box",
          }}
        />
      </div>
      <button
        onClick={onSubmit}
        disabled={disabled}
        style={{
          padding: "8px 14px",
          borderRadius: 8,
          border: "none",
          background: disabled ? COLOR.borderSubtle : `${color}18`,
          color: disabled ? COLOR.textTertiary : color,
          fontSize: 12.5,
          fontWeight: 700,
          cursor: disabled ? "default" : "pointer",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {loading ? "Saving…" : label}
      </button>
    </div>
  );
}

// ─── New part modal ───────────────────────────────────────────────────────────

// ─── New part modal (elegant redesign) ────────────────────────────────────
// Drop-in replacement for the existing NewPartModal + ModalInput.
// Reuses the same COLOR / MONO / buttonStyle tokens already in the file.

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
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,18,25,0.55)",
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: 16,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: 520,
          maxWidth: "100%",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          background: COLOR.surface,
          borderRadius: 18,
          boxShadow:
            "0 24px 60px rgba(20,24,31,0.28), 0 4px 14px rgba(20,24,31,0.10)",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "22px 26px",
            borderBottom: `1px solid ${COLOR.borderSubtle}`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 11,
              background: `linear-gradient(135deg, ${COLOR.accent} 0%, ${COLOR.accentDeep} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 16px rgba(99,102,241,0.32)",
              flexShrink: 0,
            }}
          >
            <i className="ti ti-package" style={{ fontSize: 18, color: "#fff" }} aria-hidden="true" />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p
              style={{
                margin: "0 0 2px",
                fontSize: 10.5,
                fontWeight: 700,
                color: COLOR.accent,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Parts inventory
            </p>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: COLOR.textPrimary, margin: 0 }}>
              Add new part
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              border: "none",
              background: COLOR.bg,
              width: 30,
              height: 30,
              borderRadius: 9,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <i className="ti ti-x" style={{ fontSize: 15, color: COLOR.textTertiary }} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "22px 26px 6px", overflowY: "auto", flex: 1 }}>
          <ModalSection title="Basic info" icon="ti-info-circle">
            <ModalInput label="Name" required value={form.name} onChange={(v) => set("name", v)} placeholder="e.g. Compressor belt" />
            <div style={{ display: "flex", gap: 10 }}>
              <ModalInput label="Part number" value={form.partNumber ?? ""} onChange={(v) => set("partNumber", v || null)} placeholder="PN-0042" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <ModalLabel>Category</ModalLabel>
                <select
                  value={form.category ?? ""}
                  onChange={(e) => set("category", e.target.value || null)}
                  style={selectStyle}
                >
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </ModalSection>

          <ModalSection title="Stock & pricing" icon="ti-adjustments-dollar">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 10,
                background: COLOR.bg,
                border: `1px solid ${COLOR.borderSubtle}`,
                borderRadius: 12,
                padding: 14,
              }}
            >
              <ModalInput bare label="Initial qty" type="number" value={String(form.quantityOnHand ?? 0)} onChange={(v) => set("quantityOnHand", Number(v) || 0)} />
              <ModalInput bare label="Unit" value={form.unitOfMeasure ?? "pcs"} onChange={(v) => set("unitOfMeasure", v)} />
              <ModalInput bare label="Minimum qty" type="number" value={String(form.minQuantity ?? 0)} onChange={(v) => set("minQuantity", Number(v) || 0)} />
              <ModalInput bare label="Unit cost" type="number" value={String(form.unitCost ?? 0)} onChange={(v) => set("unitCost", Number(v) || 0)} prefix="$" />
            </div>
          </ModalSection>

          <ModalSection title="Sourcing" icon="ti-truck-delivery">
            <div style={{ display: "flex", gap: 10 }}>
              <ModalInput label="Vendor" value={form.vendor ?? ""} onChange={(v) => set("vendor", v || null)} placeholder="Supplier name" />
              <ModalInput label="Location" value={form.location ?? ""} onChange={(v) => set("location", v || null)} placeholder="Shelf / bin" />
            </div>
            <ModalInput label="Barcode" value={form.barcode ?? ""} onChange={(v) => set("barcode", v || null)} placeholder="Scan or enter code" />
          </ModalSection>

          <ModalSection title="Notes" icon="ti-notes" last>
            <textarea
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value || null)}
              rows={3}
              placeholder="Any additional detail about this part…"
              className="modal-focusable"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: `1px solid ${COLOR.border}`,
                fontSize: 13,
                resize: "vertical",
                boxSizing: "border-box",
                fontFamily: "inherit",
                color: COLOR.textPrimary,
                background: COLOR.surface,
              }}
            />
          </ModalSection>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            padding: "16px 26px",
            borderTop: `1px solid ${COLOR.borderSubtle}`,
            flexShrink: 0,
          }}
        >
          <button onClick={onClose} style={buttonStyle("ghost")}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !form.name.trim()}
            style={{ ...buttonStyle("primary"), opacity: isLoading || !form.name.trim() ? 0.6 : 1 }}
          >
            {isLoading ? "Creating…" : "Create part"}
          </button>
        </div>
      </div>

      <style>{`
        .modal-focusable:focus {
          outline: none;
          border-color: ${COLOR.accent} !important;
          box-shadow: 0 0 0 3px ${COLOR.accentSurface};
        }
      `}</style>
    </div>
  );
}

// ─── Modal sub-components ──────────────────────────────────────────────────

function ModalSection({
  title,
  icon,
  children,
  last,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div style={{ marginBottom: last ? 4 : 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
        <i className={`ti ${icon}`} style={{ fontSize: 13, color: COLOR.accent }} aria-hidden="true" />
        <h3
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: COLOR.accent,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            margin: 0,
          }}
        >
          {title}
        </h3>
        <div style={{ flex: 1, height: 1, background: COLOR.borderSubtle }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
    </div>
  );
}

function ModalLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ fontSize: 11.5, fontWeight: 600, color: COLOR.textSecondary, display: "block", marginBottom: 5 }}>
      {children}
    </label>
  );
}

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 10px",
  borderRadius: 10,
  border: `1px solid ${COLOR.border}`,
  fontSize: 13,
  boxSizing: "border-box",
  color: COLOR.textPrimary,
  background: COLOR.surface,
};

function ModalInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  bare,
  prefix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  bare?: boolean; // compact variant for the stock/pricing grid
  prefix?: string;
}) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <ModalLabel>
        {label}
        {required && <span style={{ color: COLOR.danger }}> *</span>}
      </ModalLabel>
      <div style={{ position: "relative" }}>
        {prefix && (
          <span
            style={{
              position: "absolute",
              left: 11,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 12.5,
              color: COLOR.textTertiary,
              pointerEvents: "none",
            }}
          >
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="modal-focusable"
          style={{
            width: "100%",
            padding: prefix ? "9px 10px 9px 22px" : "9px 10px",
            borderRadius: 10,
            border: `1px solid ${COLOR.border}`,
            fontSize: 13,
            outline: "none",
            boxSizing: "border-box",
            background: bare ? COLOR.surface : COLOR.surface,
            color: COLOR.textPrimary,
          }}
        />
      </div>
    </div>
  );
}