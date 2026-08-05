/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";

import { EMPTY_TRIGGER_FORM, MeterTrigger, TechnicianRef, TriggerFormInput, TriggerOperator } from "@/redux/Meter/Meterapi";
import { TRIGGER_OPERATOR_LABELS, PRIORITY_OPTIONS } from "@/types/Metertokens";
import { Modal, fieldLabel, fieldInput, secondaryButton, primaryButton } from "./Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  meterUnit: string;
  technicianOptions: TechnicianRef[];
  editingTrigger?: MeterTrigger | null;
  onSubmit: (data: TriggerFormInput) => Promise<void> | void;
  isSubmitting?: boolean;
}

const OPERATORS: TriggerOperator[] = ["gte", "lte", "eq", "between", "increased_by"];

export function MeterTriggerModal({
  open,
  onClose,
  meterUnit,
  technicianOptions,
  editingTrigger,
  onSubmit,
  isSubmitting,
}: Props) {
  const [form, setForm] = useState<TriggerFormInput>(EMPTY_TRIGGER_FORM);
  const [notifyEmailsRaw, setNotifyEmailsRaw] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editingTrigger) {
      const { id, ...rest } = editingTrigger;
      setForm(rest);
      setNotifyEmailsRaw(rest.notifyEmails.join(", "));
    } else {
      setForm(EMPTY_TRIGGER_FORM);
      setNotifyEmailsRaw("");
    }
    setError(null);
  }, [open, editingTrigger]);

  const toggleTechnician = (tech: TechnicianRef) => {
    setForm((f) => {
      const exists = f.assignTechnicians.some((t) => t.id === tech.id);
      return {
        ...f,
        assignTechnicians: exists
          ? f.assignTechnicians.filter((t) => t.id !== tech.id)
          : [...f.assignTechnicians, tech],
      };
    });
  };

  const handleSubmit = async () => {
    if (!form.label.trim()) {
      setError("Give the trigger a label.");
      return;
    }
    if (form.operator === "between" && (form.valueMax === null || form.valueMax === undefined)) {
      setError("A 'between' trigger needs an upper bound.");
      return;
    }

    setError(null);
    const notifyEmails = notifyEmailsRaw
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    try {
      await onSubmit({ ...form, notifyEmails });
      onClose();
    } catch {
      setError("Something went wrong saving the trigger. Please try again.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingTrigger ? "Edit trigger" : "Add trigger"}
      subtitle="Opens a work order automatically when a reading matches this condition."
      width={520}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={fieldLabel}>Label</label>
          <input
            style={fieldInput}
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            placeholder="e.g. Overheat warning"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: form.operator === "between" ? "1.4fr 1fr 1fr" : "1.4fr 1fr", gap: 10 }}>
          <div>
            <label style={fieldLabel}>Condition</label>
            <select
              style={fieldInput}
              value={form.operator}
              onChange={(e) => setForm((f) => ({ ...f, operator: e.target.value as TriggerOperator }))}
            >
              {OPERATORS.map((op) => (
                <option key={op} value={op}>
                  {TRIGGER_OPERATOR_LABELS[op]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={fieldLabel}>{form.operator === "between" ? "Min" : "Value"} ({meterUnit})</label>
            <input
              style={fieldInput}
              type="number"
              value={form.value}
              onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))}
            />
          </div>

          {form.operator === "between" && (
            <div>
              <label style={fieldLabel}>Max ({meterUnit})</label>
              <input
                style={fieldInput}
                type="number"
                value={form.valueMax ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, valueMax: e.target.value === "" ? null : Number(e.target.value) }))}
              />
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={fieldLabel}>Work order priority</label>
            <select
              style={fieldInput}
              value={form.workOrderPriority}
              onChange={(e) => setForm((f) => ({ ...f, workOrderPriority: e.target.value }))}
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p[0].toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, paddingBottom: 9 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "#374151", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={form.createWorkOrder}
                onChange={(e) => setForm((f) => ({ ...f, createWorkOrder: e.target.checked }))}
              />
              Create work order
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "#374151", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              />
              Active
            </label>
          </div>
        </div>

        <div>
          <label style={fieldLabel}>Work order description</label>
          <textarea
            style={{ ...fieldInput, minHeight: 60, resize: "vertical" }}
            value={form.workOrderDescription}
            onChange={(e) => setForm((f) => ({ ...f, workOrderDescription: e.target.value }))}
            placeholder="What the assigned technician should check first"
          />
        </div>

        {technicianOptions.length > 0 && (
          <div>
            <label style={fieldLabel}>Assign technicians</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {technicianOptions.map((tech) => {
                const active = form.assignTechnicians.some((t) => t.id === tech.id);
                return (
                  <button
                    key={tech.id}
                    type="button"
                    onClick={() => toggleTechnician(tech)}
                    style={{
                      padding: "6px 11px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      border: active ? "1px solid #6366F1" : "1px solid #E5E7EB",
                      background: active ? "#EEF2FF" : "#fff",
                      color: active ? "#4338CA" : "#6B7280",
                      cursor: "pointer",
                    }}
                  >
                    {tech.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <label style={fieldLabel}>Also notify (emails, comma separated)</label>
          <input
            style={fieldInput}
            value={notifyEmailsRaw}
            onChange={(e) => setNotifyEmailsRaw(e.target.value)}
            placeholder="ops@company.com, manager@company.com"
          />
        </div>

        {error && <p style={{ fontSize: 12.5, color: "#DC2626", margin: 0 }}>{error}</p>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
          <button style={secondaryButton} onClick={onClose}>
            Cancel
          </button>
          <button style={{ ...primaryButton, opacity: isSubmitting ? 0.7 : 1 }} onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : editingTrigger ? "Save trigger" : "Add trigger"}
          </button>
        </div>
      </div>
    </Modal>
  );
}