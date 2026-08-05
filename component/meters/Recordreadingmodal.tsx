"use client";

import { useState } from "react";

import { Meter } from "@/redux/Meter/Meterapi";
import { Modal, fieldLabel, fieldInput, secondaryButton, primaryButton } from "./Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  meter: Meter | null;
  onSubmit: (value: number, note?: string) => Promise<{ triggeredWorkOrder: boolean } | void>;
  isSubmitting?: boolean;
}

export function RecordReadingModal({ open, onClose, meter, onSubmit, isSubmitting }: Props) {
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const reset = () => {
    setValue("");
    setNote("");
    setError(null);
    setConfirmation(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!meter) return null;

  const handleSubmit = async () => {
    const numeric = Number(value);
    if (value.trim() === "" || isNaN(numeric)) {
      setError("Enter a numeric reading.");
      return;
    }
    if (meter.readingType === "cumulative" && meter.lastReadingValue !== null && numeric < meter.lastReadingValue) {
      setError(`This is a cumulative meter — the reading can't be lower than the last value (${meter.lastReadingValue}).`);
      return;
    }

    setError(null);
    try {
      const result = await onSubmit(numeric, note.trim() || undefined);
      if (result?.triggeredWorkOrder) {
        setConfirmation("Reading recorded — a trigger fired and a work order was created.");
      } else {
        setConfirmation("Reading recorded.");
      }
      setTimeout(() => {
        reset();
        onClose();
      }, 1100);
    } catch {
      setError("Something went wrong recording the reading. Please try again.");
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Record reading" subtitle={meter.name} width={420}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {meter.lastReadingValue !== null && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12.5,
              color: "#6B7280",
              background: "#FAFAFB",
              border: "1px solid #F0F0F2",
              borderRadius: 10,
              padding: "9px 12px",
            }}
          >
            <span>Last reading</span>
            <span style={{ fontWeight: 700, color: "#374151" }}>
              {meter.lastReadingValue} {meter.unit}
            </span>
          </div>
        )}

        <div>
          <label style={fieldLabel}>New value ({meter.unit})</label>
          <input
            style={fieldInput}
            type="number"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0"
            autoFocus
          />
        </div>

        <div>
          <label style={fieldLabel}>Note (optional)</label>
          <textarea
            style={{ ...fieldInput, minHeight: 60, resize: "vertical" }}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything worth flagging about this reading"
          />
        </div>

        {error && <p style={{ fontSize: 12.5, color: "#DC2626", margin: 0 }}>{error}</p>}
        {confirmation && <p style={{ fontSize: 12.5, color: "#15803D", fontWeight: 600, margin: 0 }}>{confirmation}</p>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
          <button style={secondaryButton} onClick={handleClose}>
            Cancel
          </button>
          <button style={{ ...primaryButton, opacity: isSubmitting ? 0.7 : 1 }} onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting…" : "Submit reading"}
          </button>
        </div>
      </div>
    </Modal>
  );
}