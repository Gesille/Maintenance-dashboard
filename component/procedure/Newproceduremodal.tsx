"use client";

import { CSSProperties, useState } from "react";


import { CreateProcedureInput } from "@/redux/procedure/Procedureapi";
import { BRAND_GRADIENT } from "@/types/Procedureui";

interface NewProcedureModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreateProcedureInput) => Promise<void>;
  isSubmitting: boolean;
}

export function NewProcedureModal({ open, onClose, onSubmit, isSubmitting }: NewProcedureModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [teams, setTeams] = useState("");
  const [scoringEnabled, setScoringEnabled] = useState(false);
  const [goalScore, setGoalScore] = useState(0);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const reset = () => {
    setTitle("");
    setDescription("");
    setTags("");
    setTeams("");
    setScoringEnabled(false);
    setGoalScore(0);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!title.trim()) return setError("Give the procedure a title.");
    setError(null);
    await onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      teams: teams.split(",").map((t) => t.trim()).filter(Boolean),
      scoringEnabled,
      goalScore: scoringEnabled ? goalScore : 0,
    });
    reset();
  };

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
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 24px 60px rgba(17,24,39,0.25)",
        }}
      >
        <div style={{ padding: "20px 22px 4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111827", margin: 0 }}>New procedure</h2>
            <p style={{ fontSize: 12, color: "#9CA3AF", margin: "2px 0 0" }}>
              Start with the basics — you&apos;ll add fields next.
            </p>
          </div>
          <button onClick={handleClose} style={iconButtonStyle} aria-label="Close">
            <i className="ti ti-x" style={{ fontSize: 16 }} aria-hidden="true" />
          </button>
        </div>

        <div style={{ padding: "16px 22px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Weekly walk-in cooler inspection"
              style={inputStyle}
              autoFocus
            />
          </div>

          <div>
            <label style={labelStyle}>Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this procedure for, and when should it be used?"
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Tags</label>
              <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="safety, hvac" style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Teams in charge</label>
              <input value={teams} onChange={(e) => setTeams(e.target.value)} placeholder="Facilities" style={inputStyle} />
            </div>
          </div>

          <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#92400E", cursor: "pointer" }}>
              <input type="checkbox" checked={scoringEnabled} onChange={(e) => setScoringEnabled(e.target.checked)} />
              Score this procedure
            </label>
            <p style={{ fontSize: 11.5, color: "#92400E", margin: "6px 0 0" }}>
              Assign points to checkbox, multiple-choice, and inspection fields. Falling under the goal
              can flag a corrective action.
            </p>
            {scoringEnabled && (
              <div style={{ marginTop: 10 }}>
                <label style={{ ...labelStyle, color: "#92400E" }}>Goal score</label>
                <input
                  type="number"
                  value={goalScore}
                  onChange={(e) => setGoalScore(Number(e.target.value))}
                  style={{ ...inputStyle, width: 110 }}
                  min={0}
                />
              </div>
            )}
          </div>

          {error && (
            <div style={{ fontSize: 12.5, color: "#B91C1C", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "8px 10px" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 2 }}>
            <button onClick={handleClose} style={{ ...ghostButtonStyle, flex: 1, justifyContent: "center", padding: "10px 0" }}>
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 10,
                border: "none",
                background: BRAND_GRADIENT,
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: isSubmitting ? "default" : "pointer",
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? "Creating…" : "Create procedure"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  color: "#6B7280",
  marginBottom: 6,
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "9px 11px",
  borderRadius: 9,
  border: "1px solid #E5E7EB",
  fontSize: 13,
  color: "#111827",
  outline: "none",
  boxSizing: "border-box",
  background: "#fff",
  fontFamily: "inherit",
};

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