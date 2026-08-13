/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { OptionScore, ProcedureField, ProcedureFieldInput, ProcedureFieldType, SCORABLE_FIELD_TYPES, VALID_FIELD_TYPES } from "@/redux/procedure/Procedureapi";
import { BRAND_GRADIENT, fieldTypeMeta } from "@/types/Procedureui";
import { CSSProperties, useEffect, useState } from "react";



interface FieldEditorModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: ProcedureFieldInput) => Promise<void>;
  editingField: ProcedureField | null;
  otherFields: ProcedureField[]; // for the "show only if" condition source
  scoringEnabledOnProcedure: boolean;
  isSubmitting: boolean;
}

const EMPTY_OPTION_SCORE = (option: string): OptionScore => ({ option, score: 0 });

export function FieldEditorModal({
  open,
  onClose,
  onSubmit,
  editingField,
  otherFields,
  scoringEnabledOnProcedure,
  isSubmitting,
}: FieldEditorModalProps) {
  const [type, setType] = useState<ProcedureFieldType>("text");
  const [label, setLabel] = useState("");
  const [required, setRequired] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [scoringEnabled, setScoringEnabled] = useState(false);
  const [maxScore, setMaxScore] = useState(0);
  const [optionScores, setOptionScores] = useState<OptionScore[]>([]);
  const [conditionFieldId, setConditionFieldId] = useState<string>("");
  const [conditionEquals, setConditionEquals] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editingField) {
      setType(editingField.type);
      setLabel(editingField.label);
      setRequired(editingField.required);
      setOptions(editingField.options.length ? editingField.options : []);
      setScoringEnabled(editingField.scoringEnabled);
      setMaxScore(editingField.maxScore);
      setOptionScores(editingField.optionScores);
      setConditionFieldId(editingField.condition?.fieldId ?? "");
      setConditionEquals(editingField.condition?.equals ?? "");
    } else {
      setType("text");
      setLabel("");
      setRequired(false);
      setOptions([]);
      setScoringEnabled(false);
      setMaxScore(0);
      setOptionScores([]);
      setConditionFieldId("");
      setConditionEquals("");
    }
    setError(null);
  }, [open, editingField]);

  if (!open) return null;

  const isScorable = SCORABLE_FIELD_TYPES.includes(type);
  const isMultipleChoice = type === "multiple_choice";
  const conditionSourceField = otherFields.find((f) => f.id === conditionFieldId) ?? null;

  const addOption = () => setOptions((prev) => [...prev, ""]);
  const updateOption = (index: number, value: string) =>
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  const removeOption = (index: number) => {
    const removed = options[index];
    setOptions((prev) => prev.filter((_, i) => i !== index));
    setOptionScores((prev) => prev.filter((os) => os.option !== removed));
  };

  const scoreForOption = (option: string) => optionScores.find((os) => os.option === option)?.score ?? 0;
  const setScoreForOption = (option: string, score: number) => {
    setOptionScores((prev) => {
      const next = prev.filter((os) => os.option !== option);
      next.push({ option, score });
      return next;
    });
  };

  const handleSubmit = async () => {
    setError(null);
    if (!label.trim()) return setError("Give this field a label.");
    if (isMultipleChoice && options.filter((o) => o.trim()).length < 2) {
      return setError("Multiple choice needs at least 2 options.");
    }
    if (conditionFieldId && !conditionEquals.trim()) {
      return setError("Set the value this field's visibility depends on.");
    }

    const input: ProcedureFieldInput = {
      type,
      label: label.trim(),
      required,
      options: isMultipleChoice ? options.map((o) => o.trim()).filter(Boolean) : [],
      scoringEnabled: isScorable ? scoringEnabled : false,
      maxScore: isScorable && !isMultipleChoice ? maxScore : 0,
      optionScores:
        isMultipleChoice && scoringEnabled
          ? options.filter((o) => o.trim()).map((o) => EMPTY_OPTION_SCORE(o.trim())).map((os) => ({
              option: os.option,
              score: scoreForOption(os.option),
            }))
          : [],
      condition: conditionFieldId ? { fieldId: conditionFieldId, equals: conditionEquals.trim() } : null,
    };

    await onSubmit(input);
  };

  return (
    <div
      onClick={onClose}
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
          width: 520,
          maxWidth: "100%",
          maxHeight: "88vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 24px 60px rgba(17,24,39,0.25)",
        }}
      >
        <div style={{ padding: "20px 22px 4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111827", margin: 0 }}>
            {editingField ? "Edit field" : "Add field"}
          </h2>
          <button onClick={onClose} style={iconButtonStyle} aria-label="Close">
            <i className="ti ti-x" style={{ fontSize: 16 }} aria-hidden="true" />
          </button>
        </div>

        <div style={{ padding: "14px 22px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Field type */}
          <div>
            <label style={labelStyle}>Field type</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {VALID_FIELD_TYPES.map((t) => {
                const meta = fieldTypeMeta(t);
                const active = type === t;
                return (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                      padding: "10px 6px",
                      borderRadius: 10,
                      border: active ? "1.5px solid #A5B4FC" : "1.5px solid #E5E7EB",
                      background: active ? "#EEF2FF" : "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <i className={`ti ${meta.icon}`} style={{ fontSize: 17, color: active ? "#4F46E5" : "#6B7280" }} aria-hidden="true" />
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: active ? "#4F46E5" : "#6B7280", textAlign: "center", lineHeight: 1.2 }}>
                      {meta.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Label */}
          <div>
            <label style={labelStyle}>{type === "section_header" ? "Section title" : "Question / label"}</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={type === "section_header" ? "e.g. Before you start" : "e.g. Is the guard rail secure?"}
              style={inputStyle}
            />
          </div>

          {type !== "section_header" && (
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151", cursor: "pointer" }}>
              <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
              Required to complete this procedure
            </label>
          )}

          {/* Multiple choice options */}
          {isMultipleChoice && (
            <div>
              <label style={labelStyle}>Options</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {options.map((opt, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      value={opt}
                      onChange={(e) => updateOption(i, e.target.value)}
                      placeholder={`Option ${i + 1}`}
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    {scoringEnabled && (
                      <input
                        type="number"
                        value={scoreForOption(opt)}
                        onChange={(e) => setScoreForOption(opt, Number(e.target.value))}
                        style={{ ...inputStyle, width: 70, textAlign: "center" }}
                        min={0}
                      />
                    )}
                    <button onClick={() => removeOption(i)} style={iconButtonStyle} aria-label="Remove option">
                      <i className="ti ti-trash" style={{ fontSize: 14, color: "#EF4444" }} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={addOption} style={{ ...ghostButtonStyle, marginTop: 8 }}>
                <i className="ti ti-plus" style={{ fontSize: 13 }} aria-hidden="true" /> Add option
              </button>
            </div>
          )}

          {/* Scoring */}
          {isScorable && scoringEnabledOnProcedure && (
            <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#92400E", cursor: "pointer" }}>
                <input type="checkbox" checked={scoringEnabled} onChange={(e) => setScoringEnabled(e.target.checked)} />
                Count toward the procedure score
              </label>
              {scoringEnabled && !isMultipleChoice && (
                <div style={{ marginTop: 10 }}>
                  <label style={{ ...labelStyle, color: "#92400E" }}>
                    Points {type === "checkbox" ? "for checked" : "for a pass"}
                  </label>
                  <input
                    type="number"
                    value={maxScore}
                    onChange={(e) => setMaxScore(Number(e.target.value))}
                    style={{ ...inputStyle, width: 100 }}
                    min={0}
                  />
                  {type === "inspection" && (
                    <p style={{ fontSize: 11.5, color: "#92400E", margin: "6px 0 0" }}>
                      Flagged earns half credit, fail earns none.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Conditional visibility */}
          {otherFields.length > 0 && type !== "section_header" && (
            <div>
              <label style={labelStyle}>Show only if (optional)</label>
              <div style={{ display: "flex", gap: 8 }}>
                <select
                  value={conditionFieldId}
                  onChange={(e) => {
                    setConditionFieldId(e.target.value);
                    setConditionEquals("");
                  }}
                  style={{ ...inputStyle, flex: 1 }}
                >
                  <option value="">No condition — always show</option>
                  {otherFields
                    .filter((f) => f.type !== "section_header")
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                </select>
              </div>
              {conditionFieldId && (
                <div style={{ marginTop: 8 }}>
                  {conditionSourceField && conditionSourceField.options.length > 0 ? (
                    <select value={conditionEquals} onChange={(e) => setConditionEquals(e.target.value)} style={inputStyle}>
                      <option value="">Equals…</option>
                      {conditionSourceField.options.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : conditionSourceField?.type === "checkbox" ? (
                    <select value={conditionEquals} onChange={(e) => setConditionEquals(e.target.value)} style={inputStyle}>
                      <option value="">Equals…</option>
                      <option value="true">Checked</option>
                      <option value="false">Unchecked</option>
                    </select>
                  ) : conditionSourceField?.type === "inspection" ? (
                    <select value={conditionEquals} onChange={(e) => setConditionEquals(e.target.value)} style={inputStyle}>
                      <option value="">Equals…</option>
                      <option value="pass">Pass</option>
                      <option value="fail">Fail</option>
                      <option value="flagged">Flagged</option>
                    </select>
                  ) : (
                    <input
                      value={conditionEquals}
                      onChange={(e) => setConditionEquals(e.target.value)}
                      placeholder="Value to match"
                      style={inputStyle}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {error && (
            <div style={{ fontSize: 12.5, color: "#B91C1C", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "8px 10px" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={onClose} style={{ ...ghostButtonStyle, flex: 1, justifyContent: "center", padding: "10px 0" }}>
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
              {isSubmitting ? "Saving…" : editingField ? "Save field" : "Add field"}
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