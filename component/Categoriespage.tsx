"use client";

import { useMemo, useState } from "react";
import * as Icons from "lucide-react";
import { Search, Plus, Pencil, Trash2, X } from "lucide-react";
import { CategoryFormInput, EMPTY_CATEGORY_FORM, useGetAllCategoriesQuery, useCreateCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation, Category } from "@/redux/Category/Categoryapi";


// Curated icon + color choices for the create/edit form — mirrors the fixed
// palette MaintainX offers rather than a raw icon picker.
const ICON_CHOICES: { icon: string; color: string; label: string }[] = [
  { icon: "AlertTriangle", color: "#EF4444", label: "Damage" },
  { icon: "Zap", color: "#F59E0B", label: "Electrical" },
  { icon: "Truck", color: "#3B82F6", label: "Fleet" },
  { icon: "Tag", color: "#6366F1", label: "Heavy Equipment" },
  { icon: "ClipboardList", color: "#8B5CF6", label: "Inspection" },
  { icon: "Wrench", color: "#EC4899", label: "Mechanical" },
  { icon: "RefreshCw", color: "#22C55E", label: "Preventive" },
  { icon: "FolderKanban", color: "#F97316", label: "Project" },
  { icon: "Snowflake", color: "#14B8A6", label: "Refrigeration" },
  { icon: "ShieldCheck", color: "#10B981", label: "Safety" },
  { icon: "FileText", color: "#EC4899", label: "Standard Operating Procedure" },
];

function CategoryIcon({ name, color, size = 16 }: { name: string; color: string; size?: number }) {
  // Icons is the whole lucide-react namespace — pull the requested icon by
  // name and fall back to Tag if the stored name doesn't resolve.
  const Lucide = (Icons as unknown as Record<string, Icons.LucideIcon>)[name] ?? Icons.Tag;
  return <Lucide size={size} color={color} strokeWidth={2} />;
}

export function CategoriesPage() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<CategoryFormInput>(EMPTY_CATEGORY_FORM);

  const { data, isLoading } = useGetAllCategoriesQuery({ search: search || undefined });
  const categories = data?.data ?? [];

  const [createCategory, { isLoading: creating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: updating }] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const selected = useMemo(
    () => categories.find((c) => c.id === selectedId) ?? categories[0] ?? null,
    [categories, selectedId],
  );

  const openCreate = () => {
    setForm(EMPTY_CATEGORY_FORM);
    setFormOpen("create");
  };

  const openEdit = (c: Category) => {
    setForm({ name: c.name, icon: c.icon, color: c.color, description: c.description });
    setFormOpen("edit");
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      if (formOpen === "create") {
        const res = await createCategory(form).unwrap();
        setSelectedId(res.data.id);
      } else if (formOpen === "edit" && selected) {
        await updateCategory({ id: selected.id, data: form }).unwrap();
      }
      setFormOpen(null);
    } catch (err) {
      console.error("Failed to save category:", err);
    }
  };

  const handleDelete = async (c: Category) => {
    if (!confirm(`Delete "${c.name}"? This can't be undone.`)) return;
    try {
      await deleteCategory(c.id).unwrap();
      if (selectedId === c.id) setSelectedId(null);
    } catch (err) {
      console.error("Failed to delete category:", err);
    }
  };

  return (
    <div style={{ display: "flex", height: "100%", background: "#fff" }}>
      {/* ── List panel ── */}
      <div
        style={{
          width: 340,
          flexShrink: 0,
          borderRight: "1px solid #E8EAFF",
          display: "flex",
          flexDirection: "column",
          background: "#F8FAFF",
          height: "100%",
        }}
      >
        <div style={{ padding: "20px 16px", background: "#fff", borderBottom: "1px solid #E8EAFF" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0, letterSpacing: "-0.025em" }}>
              Categories
            </h1>
            <button
              onClick={openCreate}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "8px 14px",
                background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
              }}
            >
              <Plus size={13} strokeWidth={2.5} /> New Category
            </button>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#F8FAFF",
              borderRadius: 10,
              padding: "0 12px",
              height: 36,
              border: "1.5px solid #E0E7FF",
            }}
          >
            <Search size={13} color="#A5B4FC" strokeWidth={2} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories…"
              style={{ border: "none", background: "transparent", fontSize: 12, color: "#0F172A", outline: "none", width: "100%" }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px 16px" }}>
          {isLoading && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8", fontSize: 12 }}>Loading…</div>
          )}
          {!isLoading && categories.length === 0 && (
            <div style={{ textAlign: "center", padding: "56px 20px", color: "#94A3B8", fontSize: 13 }}>
              No categories found
            </div>
          )}
          {categories.map((c) => {
            const isSelected = selected?.id === c.id;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 12px",
                  borderRadius: 12,
                  border: `1.5px solid ${isSelected ? "#6366F1" : "#EEF0FF"}`,
                  background: isSelected ? "linear-gradient(145deg, #F5F3FF 0%, #EEF2FF 100%)" : "#fff",
                  marginBottom: 6,
                  cursor: "pointer",
                  boxShadow: isSelected
                    ? "0 0 0 3px rgba(99,102,241,0.12), 0 2px 8px rgba(99,102,241,0.1)"
                    : "0 1px 3px rgba(15,23,42,0.04)",
                  transition: "all 0.15s ease",
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: `${c.color}18`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <CategoryIcon name={c.icon} color={c.color} />
                </div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? "#3730A3" : "#334155",
                    letterSpacing: "-0.01em",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Detail panel ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#FAFBFF" }}>
        {!selected ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", fontSize: 13 }}>
            Select a category to view its details
          </div>
        ) : (
          <div
  style={{
    flex: 1,
    width: "100%",
    padding: "24px 32px",
    boxSizing: "border-box",
  }}
>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: `${selected.color}18`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CategoryIcon name={selected.icon} color={selected.color} size={19} />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", margin: 0, letterSpacing: "-0.02em" }}>
                  {selected.name}
                </h2>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => openEdit(selected)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#6366F1",
                    background: "#EEF2FF",
                    border: "1.5px solid #C7D2FE",
                    borderRadius: 9,
                    cursor: "pointer",
                  }}
                >
                  <Pencil size={13} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(selected)}
                  title="Delete category"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "7px 9px",
                    color: "#EF4444",
                    background: "#fff",
                    border: "1.5px solid #FECACA",
                    borderRadius: 9,
                    cursor: "pointer",
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

       <div
  style={{
    width: "100%",
    background: "#fff",
    border: "1px solid #E8EAFF",
    borderRadius: 14,
    padding: "16px 20px",
    boxSizing: "border-box",
    boxShadow: "0 1px 4px rgba(99,102,241,0.06)",
  }}
>
              <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>
                Created by <strong style={{ color: "#475569" }}>{selected.createdByName}</strong> on{" "}
                {new Date(selected.createdAt).toLocaleString("en-US", {
                  month: "2-digit",
                  day: "2-digit",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
              {selected.description && (
                <p style={{ fontSize: 13, color: "#334155", marginTop: 12, lineHeight: 1.7 }}>{selected.description}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Create / Edit modal ── */}
      {formOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={() => setFormOpen(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 420,
              background: "#fff",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 20px 60px rgba(15,23,42,0.25)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: 0 }}>
                {formOpen === "create" ? "New Category" : "Edit Category"}
              </h3>
              <button onClick={() => setFormOpen(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}>
                <X size={16} />
              </button>
            </div>

            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6 }}>
              Name
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Electrical"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "9px 12px",
                borderRadius: 9,
                border: "1.5px solid #E0E7FF",
                fontSize: 13,
                marginBottom: 16,
                outline: "none",
              }}
            />

            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 8 }}>
              Icon
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {ICON_CHOICES.map((opt) => {
                const isActive = form.icon === opt.icon && form.color === opt.color;
                return (
                  <button
                    key={opt.icon}
                    title={opt.label}
                    onClick={() => setForm({ ...form, icon: opt.icon, color: opt.color })}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: `${opt.color}18`,
                      border: isActive ? `2px solid ${opt.color}` : "2px solid transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <CategoryIcon name={opt.icon} color={opt.color} />
                  </button>
                );
              })}
            </div>

            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6 }}>
              Description (optional)
            </label>
            <textarea
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "9px 12px",
                borderRadius: 9,
                border: "1.5px solid #E0E7FF",
                fontSize: 13,
                resize: "none",
                outline: "none",
                fontFamily: "inherit",
                marginBottom: 20,
              }}
            />

            <button
              onClick={handleSave}
              disabled={creating || updating || !form.name.trim()}
              style={{
                width: "100%",
                padding: "10px 0",
                background: !form.name.trim() ? "#E8EAFF" : "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                color: !form.name.trim() ? "#A5B4FC" : "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                cursor: !form.name.trim() ? "not-allowed" : "pointer",
              }}
            >
              {creating || updating ? "Saving…" : formOpen === "create" ? "Create Category" : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}