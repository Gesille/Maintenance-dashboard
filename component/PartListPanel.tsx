"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Trash2,
  Plus,
  Minus,
  SlidersHorizontal,
  Link2,
  X,
  Package,
  Loader2,
} from "lucide-react";
import { useGetPartStockHistoryQuery, useRestockPartMutation, useConsumePartMutation, useAdjustPartQuantityMutation, useLinkPartToEquipmentMutation, useUnlinkPartFromEquipmentMutation, useDeletePartMutation } from "@/redux/Part/Partapi";
import { Part, StockMovementType } from "@/types/Part";


// If you have a real equipment slice, swap this for its hook
// (e.g. useGetAllEquipmentQuery) and drop the `equipment` prop.
export interface EquipmentOption {
  id: number;
  name: string;
  code?: string | null;
}

interface Props {
  part: Part;
  equipment: EquipmentOption[]; // full equipment list, for the linking dropdown
  onDeleted?: () => void;
}

const COLORS = {
  indigo: "#6366F1",
  purple: "#8B5CF6",
  ink: "#0F172A",
  slate: "#64748B",
  slateLight: "#94A3B8",
  border: "#EEF0FF",
  borderStrong: "#E0E7FF",
  bg: "#F8FAFF",
  red: "#DC2626",
  redBg: "#FEF2F2",
  redBorder: "#FECACA",
  green: "#16A34A",
  greenBg: "#F0FDF4",
  greenBorder: "#BBF7D0",
};

function initials(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "?";
}

function formatMoney(n: number) {
  return `$${n.toFixed(2)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const MOVEMENT_LABEL: Record<StockMovementType, string> = {
  restock: "Restock",
  consume: "Consume",
  adjustment: "Adjustment",
  initial: "Initial",
};

const MOVEMENT_COLOR: Record<StockMovementType, string> = {
  restock: COLORS.green,
  consume: COLORS.red,
  adjustment: COLORS.indigo,
  initial: COLORS.slate,
};

export function PartDetailPanel({ part, equipment, onDeleted }: Props) {
  const isLow = part.isLowStock ?? part.quantityOnHand <= part.minQuantity;

  const { data: historyRes, isLoading: historyLoading } = useGetPartStockHistoryQuery(part.id);
  const history = historyRes?.data ?? [];

  const [restock, { isLoading: restocking }] = useRestockPartMutation();
  const [consume, { isLoading: consuming }] = useConsumePartMutation();
  const [adjust, { isLoading: adjusting }] = useAdjustPartQuantityMutation();
  const [linkEquipment, { isLoading: linking }] = useLinkPartToEquipmentMutation();
  const [unlinkEquipment, { isLoading: unlinking }] = useUnlinkPartFromEquipmentMutation();
  const [deletePart, { isLoading: deleting }] = useDeletePartMutation();

  const [addQty, setAddQty] = useState("");
  const [consumeQty, setConsumeQty] = useState("");
  const [newCount, setNewCount] = useState("");
  const [equipmentPick, setEquipmentPick] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linkedEquipment = useMemo(
    () => equipment.filter((e) => part.linkedEquipmentIds?.includes(e.id)),
    [equipment, part.linkedEquipmentIds],
  );

  const availableEquipment = useMemo(
    () => equipment.filter((e) => !part.linkedEquipmentIds?.includes(e.id)),
    [equipment, part.linkedEquipmentIds],
  );

  async function handleRestock() {
    const qty = Number(addQty);
    if (!qty || qty <= 0) return;
    setError(null);
    try {
      await restock({ id: part.id, quantity: qty, reason: "Manual restock" }).unwrap();
      setAddQty("");
    } catch {
      setError("Couldn't restock this part. Try again.");
    }
  }

  async function handleConsume() {
    const qty = Number(consumeQty);
    if (!qty || qty <= 0) return;
    if (qty > part.quantityOnHand) {
      setError(`Only ${part.quantityOnHand} ${part.unitOfMeasure} on hand.`);
      return;
    }
    setError(null);
    try {
      await consume({ id: part.id, quantity: qty, reason: "Manual consume" }).unwrap();
      setConsumeQty("");
    } catch {
      setError("Couldn't consume stock. Try again.");
    }
  }

  async function handleAdjust() {
    if (newCount === "") return;
    const qty = Number(newCount);
    if (qty < 0) return;
    setError(null);
    try {
      await adjust({ id: part.id, newQuantity: qty, reason: "Manual count adjustment" }).unwrap();
      setNewCount("");
    } catch {
      setError("Couldn't adjust the count. Try again.");
    }
  }

  async function handleLink() {
    if (!equipmentPick) return;
    setError(null);
    try {
      await linkEquipment({ id: part.id, equipmentId: Number(equipmentPick) }).unwrap();
      setEquipmentPick("");
    } catch {
      setError("Couldn't link that equipment. Try again.");
    }
  }

  async function handleUnlink(equipmentId: number) {
    setError(null);
    try {
      await unlinkEquipment({ id: part.id, equipmentId }).unwrap();
    } catch {
      setError("Couldn't unlink that equipment. Try again.");
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      await deletePart(part.id).unwrap();
      onDeleted?.();
    } catch {
      setError("Couldn't delete this part. Try again.");
      setConfirmDelete(false);
    }
  }

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        height: "100%",
        overflowY: "auto",
        overflowX: "hidden",
        background: "#fff",
      }}
    >
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "28px 32px 64px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                flexShrink: 0,
                background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 17,
                boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
              }}
            >
              {initials(part.name)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h1
                  style={{
                    fontSize: 19,
                    fontWeight: 700,
                    color: COLORS.ink,
                    margin: 0,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {part.name}
                </h1>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "3px 9px",
                    borderRadius: 99,
                    background: isLow ? COLORS.redBg : COLORS.greenBg,
                    color: isLow ? COLORS.red : COLORS.green,
                    border: `1px solid ${isLow ? COLORS.redBorder : COLORS.greenBorder}`,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 99,
                      background: isLow ? COLORS.red : COLORS.green,
                    }}
                  />
                  {isLow ? "Low stock" : "In stock"}
                </span>
              </div>
              <p style={{ fontSize: 12, color: COLORS.slateLight, margin: "3px 0 0" }}>
                #{part.id}
                {part.category ? ` · ${part.category}` : ""}
              </p>
            </div>
          </div>

          <button
            onClick={handleDelete}
            onBlur={() => setConfirmDelete(false)}
            disabled={deleting}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 14px",
              borderRadius: 10,
              border: `1.5px solid ${confirmDelete ? COLORS.red : COLORS.redBorder}`,
              background: confirmDelete ? COLORS.red : COLORS.redBg,
              color: confirmDelete ? "#fff" : COLORS.red,
              fontSize: 12,
              fontWeight: 600,
              cursor: deleting ? "default" : "pointer",
              opacity: deleting ? 0.6 : 1,
              flexShrink: 0,
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            {confirmDelete ? "Confirm delete?" : "Delete"}
          </button>
        </div>

        {error && (
          <div
            style={{
              marginBottom: 20,
              padding: "10px 14px",
              borderRadius: 10,
              background: COLORS.redBg,
              border: `1px solid ${COLORS.redBorder}`,
              color: COLORS.red,
              fontSize: 12,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            {error}
            <button
              onClick={() => setError(null)}
              style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.red }}
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Stat cards — responsive grid, never overflows the panel */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <StatCard label="On hand" value={`${part.quantityOnHand} ${part.unitOfMeasure}`} highlight={isLow} />
          <StatCard label="Minimum" value={`${part.minQuantity}`} />
          <StatCard label="Unit cost" value={formatMoney(part.unitCost)} />
          <StatCard label="Stock value" value={formatMoney(part.unitCost * part.quantityOnHand)} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)",
            gap: 20,
            marginBottom: 24,
          }}
        >
          {/* Details */}
          <Section title="Details">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <Field label="Reorder qty" value={part.reorderQuantity ?? "—"} />
              <Field label="Vendor" value={part.vendor ?? "—"} />
              <Field label="Vendor part #" value={part.vendorPartNumber ?? "—"} />
              <Field label="Location" value={part.location ?? "—"} />
              <Field label="Barcode" value={part.barcode ?? "—"} />
              <Field label="Unit" value={part.unitOfMeasure} />
            </div>
            {part.description && (
              <p
                style={{
                  fontSize: 12.5,
                  color: COLORS.slate,
                  margin: "16px 0 0",
                  lineHeight: 1.6,
                  paddingTop: 14,
                  borderTop: `1px solid ${COLORS.border}`,
                }}
              >
                {part.description}
              </p>
            )}
          </Section>

          {/* Linked equipment */}
          <Section title="Linked equipment">
            {linkedEquipment.length === 0 ? (
              <div
                style={{
                  padding: "18px 14px",
                  textAlign: "center",
                  color: COLORS.slateLight,
                  fontSize: 12,
                  background: COLORS.bg,
                  borderRadius: 10,
                  border: `1px dashed ${COLORS.borderStrong}`,
                  marginBottom: 12,
                }}
              >
                <Package size={18} color="#C7D2FE" style={{ marginBottom: 6 }} />
                <div>No equipment linked yet.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                {linkedEquipment.map((eq) => (
                  <div
                    key={eq.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      padding: "9px 12px",
                      borderRadius: 10,
                      background: COLORS.bg,
                      border: `1px solid ${COLORS.border}`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <Link2 size={13} color={COLORS.indigo} style={{ flexShrink: 0 }} />
                      <span
                        style={{
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: COLORS.ink,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {eq.name}
                      </span>
                      {eq.code && (
                        <span style={{ fontSize: 11, color: COLORS.slateLight, flexShrink: 0 }}>
                          #{eq.code}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleUnlink(eq.id)}
                      disabled={unlinking}
                      title="Unlink equipment"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: unlinking ? "default" : "pointer",
                        color: COLORS.slateLight,
                        padding: 4,
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = COLORS.red)}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = COLORS.slateLight)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <select
                value={equipmentPick}
                onChange={(e) => setEquipmentPick(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: 36,
                  borderRadius: 9,
                  border: `1.5px solid ${COLORS.borderStrong}`,
                  padding: "0 10px",
                  fontSize: 12.5,
                  color: equipmentPick ? COLORS.ink : COLORS.slateLight,
                  background: "#fff",
                  outline: "none",
                }}
              >
                <option value="">Select equipment…</option>
                {availableEquipment.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleLink}
                disabled={!equipmentPick || linking}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "0 14px",
                  height: 36,
                  borderRadius: 9,
                  border: "none",
                  background: !equipmentPick || linking
                    ? "#E2E8F0"
                    : "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                  color: !equipmentPick || linking ? "#94A3B8" : "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: !equipmentPick || linking ? "default" : "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {linking ? <Loader2 size={13} className="animate-spin" /> : <Link2 size={13} />}
                Link
              </button>
            </div>
            {availableEquipment.length === 0 && equipment.length > 0 && (
              <p style={{ fontSize: 11, color: COLORS.slateLight, margin: "8px 0 0" }}>
                All available equipment is already linked.
              </p>
            )}
          </Section>
        </div>

        {/* Stock actions */}
        <Section title="Stock actions">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <StockActionRow
              icon={<Plus size={13} color={COLORS.green} strokeWidth={2.5} />}
              iconBg={COLORS.greenBg}
              placeholder="Qty to add"
              value={addQty}
              onChange={setAddQty}
              buttonLabel="Restock"
              onSubmit={handleRestock}
              loading={restocking}
              disabled={!addQty || Number(addQty) <= 0}
              accent={COLORS.green}
            />
            <StockActionRow
              icon={<Minus size={13} color={COLORS.red} strokeWidth={2.5} />}
              iconBg={COLORS.redBg}
              placeholder="Qty to consume"
              value={consumeQty}
              onChange={setConsumeQty}
              buttonLabel="Consume"
              onSubmit={handleConsume}
              loading={consuming}
              disabled={!consumeQty || Number(consumeQty) <= 0}
              accent={COLORS.red}
            />
            <StockActionRow
              icon={<SlidersHorizontal size={13} color={COLORS.indigo} strokeWidth={2.5} />}
              iconBg="#EEF2FF"
              placeholder="New count"
              value={newCount}
              onChange={setNewCount}
              buttonLabel="Adjust"
              onSubmit={handleAdjust}
              loading={adjusting}
              disabled={newCount === "" || Number(newCount) < 0}
              accent={COLORS.indigo}
            />
          </div>
        </Section>

        {/* Stock history */}
        <Section title="Stock history">
          {historyLoading ? (
            <div style={{ padding: "24px 0", textAlign: "center", color: COLORS.slateLight, fontSize: 12 }}>
              Loading history…
            </div>
          ) : history.length === 0 ? (
            <div style={{ padding: "24px 0", textAlign: "center", color: COLORS.slateLight, fontSize: 12 }}>
              No stock movements yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {history.map((m, i) => (
                <div
                  key={m._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "13px 4px",
                    borderTop: i === 0 ? "none" : `1px solid ${COLORS.border}`,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: 99,
                          background: MOVEMENT_COLOR[m.type],
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.ink }}>
                        {MOVEMENT_LABEL[m.type]}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: 11.5,
                        color: COLORS.slateLight,
                        margin: "3px 0 0 15px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {m.reason ?? (m.referenceType === "maintenance_request" ? "Used on a work order" : "Manual entry")}
                      {m.performedByName ? ` · ${m.performedByName}` : ""}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: m.quantityDelta >= 0 ? COLORS.green : COLORS.red,
                      }}
                    >
                      {m.quantityDelta >= 0 ? "+" : ""}
                      {m.quantityDelta}
                    </div>
                    <div style={{ fontSize: 10.5, color: COLORS.slateLight, marginTop: 2 }}>
                      {formatDate(m.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

// ── Subcomponents ─────────────────────────────────────────────────────────────

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: 12,
        border: `1.5px solid ${highlight ? COLORS.redBorder : COLORS.border}`,
        background: highlight ? COLORS.redBg : COLORS.bg,
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: highlight ? COLORS.red : COLORS.slateLight,
          marginBottom: 6,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {highlight && <AlertTriangle size={10} strokeWidth={2.5} />}
        {label}
      </div>
      <div
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: highlight ? COLORS.red : COLORS.ink,
          letterSpacing: "-0.02em",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          color: COLORS.slateLight,
          margin: "0 0 12px",
        }}
      >
        {title}
      </h2>
      <div
        style={{
          background: "#fff",
          border: `1px solid ${COLORS.border}`,
          borderRadius: 14,
          padding: 18,
          boxShadow: "0 1px 3px rgba(15,23,42,0.03)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: COLORS.slateLight,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: COLORS.ink,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function StockActionRow({
  icon,
  iconBg,
  placeholder,
  value,
  onChange,
  buttonLabel,
  onSubmit,
  loading,
  disabled,
  accent,
}: {
  icon: React.ReactNode;
  iconBg: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  buttonLabel: string;
  onSubmit: () => void;
  loading: boolean;
  disabled: boolean;
  accent: string;
}) {
  const isDisabled = disabled || loading;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !isDisabled && onSubmit()}
        placeholder={placeholder}
        style={{
          flex: 1,
          minWidth: 0,
          height: 38,
          borderRadius: 9,
          border: `1.5px solid ${COLORS.borderStrong}`,
          padding: "0 12px",
          fontSize: 13,
          color: COLORS.ink,
          outline: "none",
        }}
      />
      <button
        onClick={onSubmit}
        disabled={isDisabled}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "0 18px",
          height: 38,
          borderRadius: 9,
          border: "none",
          background: isDisabled ? "#E2E8F0" : accent,
          color: isDisabled ? "#94A3B8" : "#fff",
          fontSize: 12.5,
          fontWeight: 700,
          cursor: isDisabled ? "default" : "pointer",
          whiteSpace: "nowrap",
          flexShrink: 0,
          transition: "opacity 0.15s",
        }}
      >
        {loading && <Loader2 size={13} className="animate-spin" />}
        {buttonLabel}
      </button>
    </div>
  );
}