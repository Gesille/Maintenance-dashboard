/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { X, Upload, Loader, Wrench } from "lucide-react";

interface EquipmentOption {
  id: number;
  name: string;
  assetCode?: string | null;
  restaurant?: string | null;
}

interface TechnicianOption {
  id: string;
  name: string;
  email: string;
}

interface NewWorkOrderModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
  equipmentOptions: EquipmentOption[];
  technicianOptions: TechnicianOption[];
  isSubmitting: boolean;
}

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: "#10B981" },
  { value: "medium", label: "Medium", color: "#F59E0B" },
  { value: "high", label: "High", color: "#DC2626" },
];

export function NewWorkOrderModal({
  open,
  onClose,
  onSubmit,
  equipmentOptions,
  technicianOptions,
  isSubmitting,
}: NewWorkOrderModalProps) {
  const [equipmentId, setEquipmentId] = useState("");
  const [priority, setPriority] = useState("medium");
  const [description, setDescription] = useState("");
  const [reportedBy, setReportedBy] = useState("");
  const [selectedTechIds, setSelectedTechIds] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const toggleTech = (id: string) =>
    setSelectedTechIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );

  const resetForm = () => {
    setEquipmentId("");
    setPriority("medium");
    setDescription("");
    setReportedBy("");
    setSelectedTechIds([]);
    setFiles([]);
    setError(null);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async () => {
    setError(null);

    if (!equipmentId) return setError("Please select equipment.");
    if (!description.trim()) return setError("Please add a description.");

    const chosenTechs = technicianOptions.filter((t) => selectedTechIds.includes(t.id));

    const formData = new FormData();
    formData.append("equipmentId", equipmentId);
    formData.append("priority", priority);
    formData.append("description", description.trim());
    if (reportedBy.trim()) formData.append("reportedBy", reportedBy.trim());
    formData.append("technicians", JSON.stringify(chosenTechs));
    files.forEach((f) => formData.append("files", f));

    try {
      await onSubmit(formData);
      resetForm();
      onClose();
    } catch (err: any) {
      setError(err?.data?.message ?? "Failed to create work order.");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 20,
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 18,
          width: "100%",
          maxWidth: 560,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 24px 60px rgba(15,23,42,0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
            padding: "20px 24px",
            borderRadius: "18px 18px 0 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Wrench size={18} color="#fff" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff" }}>
              New Work Order
            </h3>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              borderRadius: 8,
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {error && (
            <div
              style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                color: "#DC2626",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}

          {/* Equipment */}
          <Field label="Equipment *">
            <select
              value={equipmentId}
              onChange={(e) => setEquipmentId(e.target.value)}
              style={selectStyle}
            >
              <option value="">Select equipment…</option>
              {equipmentOptions.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.name}
                  {eq.assetCode ? ` — ${eq.assetCode}` : ""}
                  {eq.restaurant ? ` (${eq.restaurant})` : ""}
                </option>
              ))}
            </select>
          </Field>

          {/* Priority */}
          <Field label="Priority *">
            <div style={{ display: "flex", gap: 8 }}>
              {PRIORITY_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  style={{
                    flex: 1,
                    padding: "9px 0",
                    borderRadius: 9,
                    border: `1.5px solid ${priority === p.value ? p.color : "#E8EAFF"}`,
                    background: priority === p.value ? `${p.color}12` : "#fff",
                    color: priority === p.value ? p.color : "#94A3B8",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </Field>

          {/* Description */}
          <Field label="Description *">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue…"
              rows={4}
              style={{ ...selectStyle, resize: "none", fontFamily: "inherit", lineHeight: 1.6 }}
            />
          </Field>

          {/* Reported by (optional) */}
          <Field label="Reported by (optional — defaults to you)">
            <input
              type="text"
              value={reportedBy}
              onChange={(e) => setReportedBy(e.target.value)}
              placeholder="e.g. kitchen staff name"
              style={selectStyle}
            />
          </Field>

          {/* Technicians */}
          <Field label="Assign technicians (optional)">
            {technicianOptions.length === 0 ? (
              <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>
                No technician accounts found.
              </p>
            ) : (
              <div
                style={{
                  border: "1.5px solid #E8EAFF",
                  borderRadius: 10,
                  padding: 12,
                  maxHeight: 150,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {technicianOptions.map((t) => (
                  <label
                    key={t.id}
                    style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTechIds.includes(t.id)}
                      onChange={() => toggleTech(t.id)}
                      style={{ accentColor: "#6366F1" }}
                    />
                    <span style={{ fontWeight: 600, color: "#0F172A" }}>{t.name}</span>
                    <span style={{ color: "#94A3B8", fontSize: 11 }}>{t.email}</span>
                  </label>
                ))}
              </div>
            )}
            {selectedTechIds.length > 0 && (
              <p style={{ fontSize: 11, color: "#6366F1", margin: "6px 0 0", fontWeight: 600 }}>
                Status will be set to &quot;Under Repair&quot; and technicians notified by email.
              </p>
            )}
          </Field>

          {/* Media */}
          <Field label="Photos / Videos (optional)">
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                border: "1.5px dashed #C7D2FE",
                borderRadius: 10,
                padding: "12px 14px",
                cursor: "pointer",
                fontSize: 12,
                color: "#6366F1",
                fontWeight: 600,
              }}
            >
              <Upload size={14} />
              {files.length > 0 ? `${files.length} file(s) selected` : "Choose files…"}
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFilesChange}
                style={{ display: "none" }}
              />
            </label>
          </Field>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #E8EAFF",
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            style={{
              padding: "9px 18px",
              borderRadius: 9,
              border: "1.5px solid #E8EAFF",
              background: "#fff",
              color: "#64748B",
              fontSize: 12,
              fontWeight: 600,
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              padding: "9px 20px",
              borderRadius: 9,
              border: "none",
              background: isSubmitting ? "#E8EAFF" : "linear-gradient(135deg, #6366F1, #8B5CF6)",
              color: isSubmitting ? "#A5B4FC" : "#fff",
              fontSize: 12,
              fontWeight: 700,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {isSubmitting && <Loader size={12} style={{ animation: "spin 0.7s linear infinite" }} />}
            {isSubmitting ? "Creating…" : "Create Work Order"}
          </button>
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#64748B", margin: "0 0 6px", letterSpacing: "-0.01em" }}>
        {label}
      </p>
      {children}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  borderRadius: 9,
  border: "1.5px solid #E8EAFF",
  fontSize: 13,
  color: "#0F172A",
  outline: "none",
};