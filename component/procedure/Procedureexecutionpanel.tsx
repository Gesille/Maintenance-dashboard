/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ProcedureField,
  ProcedureInstance,
  ProcedureResponseInput,
  useCompleteProcedureMutation,
  useSubmitProcedureResponsesMutation,
} from "@/redux/procedure/Procedureapi";

interface Props {
  requestId: number;
  instances: ProcedureInstance[];
  accentColor: string;
}

type ResponseValue = string | number | boolean | string[] | null;

function asDisplayValue(value: ResponseValue): string {
  return typeof value === "boolean" ? String(value) : String(value ?? "");
}

function isVisible(field: ProcedureField, values: Record<string, ResponseValue>) {
  if (!field.condition) return true;
  return asDisplayValue(values[field.condition.fieldId]) === field.condition.equals;
}

function initialValues(instance: ProcedureInstance): Record<string, ResponseValue> {
  return Object.fromEntries(instance.responses.map((response) => [response.fieldId, response.value]));
}

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: { message?: string } }).data;
    if (data?.message) return data.message;
  }
  return "The procedure could not be saved. Please try again.";
}

export function ProcedureExecutionPanel({ requestId, instances, accentColor }: Props) {
  const [activeId, setActiveId] = useState(instances[0]?.instanceId ?? "");
  const active = instances.find((instance) => instance.instanceId === activeId) ?? instances[0] ?? null;
  const [values, setValues] = useState<Record<string, ResponseValue>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitResponses, { isLoading: saving }] = useSubmitProcedureResponsesMutation();
  const [completeProcedure, { isLoading: completing }] = useCompleteProcedureMutation();

  useEffect(() => {
    if (!active) return;
    setActiveId(active.instanceId);
    setValues(initialValues(active));
    setError(null);
  }, [active?.instanceId]);

  const visibleFields = useMemo(
    () => active?.fields.slice().sort((a, b) => a.order - b.order).filter((field) => isVisible(field, values)) ?? [],
    [active, values],
  );
  const answerableFields = visibleFields.filter((field) => field.type !== "section_header");
  const answeredCount = answerableFields.filter((field) => {
    const value = values[field.id];
    return value !== undefined && value !== null && value !== "";
  }).length;
  const percent = answerableFields.length ? Math.round((answeredCount / answerableFields.length) * 100) : 0;
  const totalScore = active?.scoringEnabled
    ? answerableFields.reduce((sum, field) => sum + (active.responses.find((response) => response.fieldId === field.id)?.scoreEarned ?? 0), 0)
    : null;

  if (!instances.length) return null;

  const setValue = (fieldId: string, value: ResponseValue) => {
    setValues((current) => ({ ...current, [fieldId]: value }));
    setError(null);
  };

  const save = async (): Promise<boolean> => {
    if (!active) return false;
    const responses: ProcedureResponseInput[] = Object.entries(values).map(([fieldId, value]) => ({ fieldId, value }));
    try {
      setError(null);
      await submitResponses({ requestId, instanceId: active.instanceId, responses }).unwrap();
      return true;
    } catch (err) {
      setError(errorMessage(err));
      return false;
    }
  };

  const complete = async () => {
    if (!active) return;
    try {
      setError(null);
      const saved = await save();
      if (!saved) return;
      await completeProcedure({ requestId, instanceId: active.instanceId }).unwrap();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <section style={{ marginBottom: 24 }} aria-label="Procedures">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 12 }}>
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", margin: 0 }}>Procedures</h3>
          <p style={{ fontSize: 11.5, color: "#94A3B8", margin: "3px 0 0" }}>Complete each procedure attached to this work order.</p>
        </div>
        {active && (
          <span style={{ fontSize: 11, fontWeight: 700, color: active.completedAt ? "#047857" : accentColor }}>
            {active.completedAt ? "Completed" : `${answeredCount}/${answerableFields.length} answered`}
          </span>
        )}
      </div>

      {instances.length > 1 && (
        <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 10, paddingBottom: 2 }}>
          {instances.map((instance) => {
            const selected = instance.instanceId === active?.instanceId;
            return (
              <button
                key={instance.instanceId}
                onClick={() => setActiveId(instance.instanceId)}
                style={{
                  flex: "0 0 auto",
                  border: `1px solid ${selected ? accentColor : "#E8EAFF"}`,
                  background: selected ? `${accentColor}10` : "#fff",
                  color: selected ? accentColor : "#475569",
                  borderRadius: 8,
                  padding: "7px 10px",
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {instance.title}
                {instance.completedAt ? " · Done" : ""}
              </button>
            );
          })}
        </div>
      )}

      {active && (
        <div style={{ background: "#fff", border: "1px solid #E8EAFF", borderRadius: 14, padding: "16px 20px", boxShadow: "0 1px 4px rgba(99,102,241,0.05)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", margin: 0 }}>{active.title}</p>
              <p style={{ fontSize: 11.5, color: "#94A3B8", margin: "3px 0 0" }}>
                Attached by {active.attachedBy} · {active.scoringEnabled ? `${active.totalScore ?? totalScore ?? 0}/${active.maxScore} points` : "No scoring"}
              </p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: active.completedAt ? "#047857" : "#64748B", background: active.completedAt ? "#ECFDF5" : "#F8FAFC", borderRadius: 99, padding: "4px 8px" }}>
              {active.completedAt ? "Completed" : "In progress"}
            </span>
          </div>

          <div style={{ height: 6, borderRadius: 99, background: "#EEF2FF", overflow: "hidden", marginBottom: 16 }}>
            <div style={{ width: `${percent}%`, height: "100%", background: percent === 100 ? "#10B981" : accentColor, transition: "width .2s ease" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {visibleFields.map((field) => (
              <ProcedureFieldControl key={field.id} field={field} value={values[field.id]} onChange={(value) => setValue(field.id, value)} disabled={Boolean(active.completedAt)} accentColor={accentColor} />
            ))}
          </div>

          {error && <div style={{ marginTop: 14, padding: "9px 10px", borderRadius: 8, background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", fontSize: 12 }}>{error}</div>}

          {!active.completedAt && (
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={save} disabled={saving || completing} style={secondaryButtonStyle}>{saving ? "Saving…" : "Save progress"}</button>
              <button onClick={complete} disabled={saving || completing} style={{ ...primaryButtonStyle, background: accentColor }}>{completing ? "Completing…" : "Complete procedure"}</button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function ProcedureFieldControl({ field, value, onChange, disabled, accentColor }: { field: ProcedureField; value: ResponseValue; onChange: (value: ResponseValue) => void; disabled: boolean; accentColor: string }) {
  if (field.type === "section_header") {
    return <div style={{ padding: "10px 0 2px", borderBottom: "1px solid #EEF2FF", color: "#3730A3", fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".05em" }}>{field.label}</div>;
  }
  const label = <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 6 }}>{field.label}{field.required && <span style={{ color: "#DC2626", marginLeft: 4 }}>*</span>}</label>;
  const inputStyle = { width: "100%", boxSizing: "border-box" as const, border: "1px solid #E2E8F0", borderRadius: 8, padding: "8px 10px", fontSize: 12.5, color: "#0F172A", background: disabled ? "#F8FAFC" : "#fff" };
  switch (field.type) {
    case "text": return <div>{label}<textarea rows={3} value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} disabled={disabled} style={{ ...inputStyle, resize: "vertical" }} /></div>;
    case "number": return <div>{label}<input type="number" value={value === null || value === undefined ? "" : String(value)} onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))} disabled={disabled} style={{ ...inputStyle, maxWidth: 220 }} /></div>;
    case "checkbox": return <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#334155", cursor: disabled ? "default" : "pointer" }}><input type="checkbox" checked={value === true} onChange={(event) => onChange(event.target.checked)} disabled={disabled} style={{ accentColor }} />{field.label}{field.required && <span style={{ color: "#DC2626" }}>*</span>}</label>;
    case "multiple_choice": return <div>{label}<select value={String(value ?? "")} onChange={(event) => onChange(event.target.value || null)} disabled={disabled} style={inputStyle}><option value="">Select an option…</option>{field.options.map((option) => <option key={option} value={option}>{option}</option>)}</select></div>;
    case "inspection": return <div>{label}<select value={String(value ?? "")} onChange={(event) => onChange(event.target.value || null)} disabled={disabled} style={inputStyle}><option value="">Select result…</option><option value="pass">Pass</option><option value="flagged">Flagged</option><option value="fail">Fail</option></select></div>;
    case "date": return <div>{label}<input type="date" value={String(value ?? "")} onChange={(event) => onChange(event.target.value || null)} disabled={disabled} style={{ ...inputStyle, maxWidth: 220 }} /></div>;
    case "photo": return <div>{label}<input type="url" placeholder="Paste evidence URL" value={String(value ?? "")} onChange={(event) => onChange(event.target.value || null)} disabled={disabled} style={inputStyle} /></div>;
    case "signature": return <div>{label}<input type="text" placeholder="Enter signer name" value={String(value ?? "")} onChange={(event) => onChange(event.target.value || null)} disabled={disabled} style={inputStyle} /></div>;
    default: return null;
  }
}

const secondaryButtonStyle = { flex: 1, padding: "9px 12px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", color: "#475569", fontSize: 12, fontWeight: 800, cursor: "pointer" };
const primaryButtonStyle = { flex: 1, padding: "9px 12px", borderRadius: 8, border: "none", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer" };
