"use client";

import { useState } from "react";

import { EMPTY_METER_FORM, MeterFormInput, MeterType, MeterReadingTypeKind } from "@/redux/Meter/Meterapi";
import { READING_TYPE_HINT } from "@/types/Metertokens";
import { Modal, fieldLabel, fieldInput, secondaryButton, primaryButton } from "./Modal";

interface EquipmentOption {
  id: number;
  name: string;
  assetCode: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: MeterFormInput) => Promise<void> | void;
  equipmentOptions: EquipmentOption[];
  isSubmitting?: boolean;
}

export function NewMeterModal({ open, onClose, onSubmit, equipmentOptions, isSubmitting }: Props) {
  const [form, setForm] = useState<MeterFormInput>(EMPTY_METER_FORM);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setForm(EMPTY_METER_FORM);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.equipmentId || !form.unit.trim()) {
      setError("Name, equipment and unit are required.");
      return;
    }
    setError(null);
    try {
      await onSubmit(form);
      reset();
      onClose();
    } catch {
      setError("Something went wrong creating the meter. Please try again.");
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="New meter" subtitle="Track a reading against a piece of equipment.">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={fieldLabel}>Meter name</label>
          <input
            style={fieldInput}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Walk-in freezer temperature"
          />
        </div>

        <div>
          <label style={fieldLabel}>Equipment</label>
          <select
            style={fieldInput}
            value={form.equipmentId || ""}
            onChange={(e) => setForm((f) => ({ ...f, equipmentId: Number(e.target.value) }))}
          >
            <option value="" disabled>
              Select equipment…
            </option>
            {equipmentOptions.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.name}
                {eq.assetCode ? ` (${eq.assetCode})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={fieldLabel}>Unit</label>
            <input
              style={fieldInput}
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              placeholder="hours, °F, psi…"
            />
          </div>

          <div>
            <label style={fieldLabel}>Meter type</label>
            <select
              style={fieldInput}
              value={form.meterType}
              onChange={(e) => setForm((f) => ({ ...f, meterType: e.target.value as MeterType }))}
            >
              <option value="manual">Manual</option>
              <option value="automated">Automated</option>
            </select>
          </div>
        </div>

        <div>
          <label style={fieldLabel}>Reading type</label>
          <div style={{ display: "flex", gap: 8 }}>
            {(["gauge", "cumulative"] as MeterReadingTypeKind[]).map((rt) => {
              const active = form.readingType === rt;
              return (
                <button
                  key={rt}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, readingType: rt }))}
                  style={{
                    flex: 1,
                    textAlign: "left",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: active ? "1px solid #6366F1" : "1px solid #E5E7EB",
                    background: active ? "#EEF2FF" : "#fff",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: active ? "#4338CA" : "#374151" }}>
                    {rt === "gauge" ? "Gauge" : "Cumulative"}
                  </div>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{READING_TYPE_HINT[rt]}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label style={fieldLabel}>Description (optional)</label>
          <textarea
            style={{ ...fieldInput, minHeight: 70, resize: "vertical" }}
            value={form.description ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="What this meter tracks and why it matters"
          />
        </div>

        {error && <p style={{ fontSize: 12.5, color: "#DC2626", margin: 0 }}>{error}</p>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
          <button style={secondaryButton} onClick={handleClose}>
            Cancel
          </button>
          <button style={{ ...primaryButton, opacity: isSubmitting ? 0.7 : 1 }} onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create meter"}
          </button>
        </div>
      </div>
    </Modal>
  );
}