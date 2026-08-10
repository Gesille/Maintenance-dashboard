// app/dashboard/vendors/page.tsx
"use client";

import { useState } from "react";
import { Plus, Search, Edit3, Trash2, Save, X, Loader, Building2, Phone, Mail, MapPin, Globe } from "lucide-react";
import { WorkOrderSidebar } from "@/component/Sidebar";
import { Toaster } from "@/component/Toaster";
import { useToast } from "@/types/useToast";
import { Vendor, VendorFormInput, EMPTY_VENDOR_FORM } from "@/types/vendor";
import {
  useGetAllVendorsQuery,
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useDeleteVendorMutation,
} from "@/redux/Vendor/Vendorapi";

export default function VendorsPage() {
  const { data, isLoading } = useGetAllVendorsQuery();
  const [createVendor] = useCreateVendorMutation();
  const [updateVendor] = useUpdateVendorMutation();
  const [deleteVendor] = useDeleteVendorMutation();
  const { toasts, addToast, removeToast } = useToast();

  const vendors: Vendor[] = data?.data ?? [];

  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null); // 0 = creating
  const [form, setForm] = useState<VendorFormInput>(EMPTY_VENDOR_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filtered = vendors.filter(
    (v) => search === "" || v.name.toLowerCase().includes(search.toLowerCase()),
  );

  const startCreate = () => {
    setEditingId(0);
    setForm(EMPTY_VENDOR_FORM);
  };
  const startEdit = (v: Vendor) => {
    setEditingId(v.id);
    setForm({
      name: v.name,
      contactName: v.contactName,
      phone: v.phone,
      email: v.email,
      address: v.address,
      website: v.website,
      notes: v.notes,
    });
  };
  const cancel = () => {
    setEditingId(null);
    setForm(EMPTY_VENDOR_FORM);
  };

  const handleField = (key: keyof VendorFormInput, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value === "" ? null : value }));
  };

  const save = async () => {
    if (!form.name?.trim()) return;
    setSaving(true);
    try {
      if (editingId === 0) {
        await createVendor(form).unwrap();
        addToast("Vendor created", "success");
      } else if (editingId) {
        await updateVendor({ id: editingId, data: form }).unwrap();
        addToast("Vendor updated", "success");
      }
      cancel();
    } catch {
      addToast("Something went wrong. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteVendor(id).unwrap();
      addToast("Vendor deleted", "success");
    } catch {
      addToast("Failed to delete vendor", "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#F8FAFF" }}>
      <WorkOrderSidebar />
      <main style={{ flex: 1, overflowY: "auto", padding: "28px 36px" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", margin: "0 0 4px", letterSpacing: "-0.03em" }}>
          Vendors
        </h1>
        <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 20px" }}>
          Manage vendors used on the Equipment form.
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#fff",
              borderRadius: 10,
              padding: "0 12px",
              height: 36,
              border: "1.5px solid #E0E7FF",
              maxWidth: 300,
            }}
          >
            <Search size={13} color="#A5B4FC" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vendors…"
              style={{ border: "none", outline: "none", background: "transparent", fontSize: 12, width: "100%" }}
            />
          </div>
          <button
            onClick={startCreate}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 16px",
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
            <Plus size={14} strokeWidth={2.5} /> New vendor
          </button>
        </div>

        {editingId !== null && (
          <div
            style={{
              background: "#fff",
              border: "1px solid #E8EAFF",
              borderRadius: 14,
              padding: "18px 20px",
              marginBottom: 16,
              boxShadow: "0 1px 4px rgba(99,102,241,0.06)",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <Field label="Company name" required>
                <input
                  value={form.name}
                  onChange={(e) => handleField("name", e.target.value)}
                  autoFocus
                  style={inputStyle()}
                  placeholder="e.g. Acme Refrigeration Co."
                />
              </Field>
              <Field label="Contact person">
                <input
                  value={form.contactName ?? ""}
                  onChange={(e) => handleField("contactName", e.target.value)}
                  style={inputStyle()}
                  placeholder="e.g. Jane Smith"
                />
              </Field>
              <Field label="Phone">
                <input
                  value={form.phone ?? ""}
                  onChange={(e) => handleField("phone", e.target.value)}
                  style={inputStyle()}
                  placeholder="e.g. +1 (555) 123-4567"
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={form.email ?? ""}
                  onChange={(e) => handleField("email", e.target.value)}
                  style={inputStyle()}
                  placeholder="e.g. sales@acme.com"
                />
              </Field>
              <Field label="Website">
                <input
                  value={form.website ?? ""}
                  onChange={(e) => handleField("website", e.target.value)}
                  style={inputStyle()}
                  placeholder="e.g. https://acme.com"
                />
              </Field>
              <Field label="Address">
                <input
                  value={form.address ?? ""}
                  onChange={(e) => handleField("address", e.target.value)}
                  style={inputStyle()}
                  placeholder="e.g. 123 Main St, Springfield"
                />
              </Field>
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Notes">
                  <textarea
                    value={form.notes ?? ""}
                    onChange={(e) => handleField("notes", e.target.value)}
                    rows={2}
                    style={inputStyle()}
                  />
                </Field>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={save}
                disabled={saving}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#fff",
                  background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                  border: "none",
                  borderRadius: 9,
                  cursor: "pointer",
                }}
              >
                {saving ? <Loader size={13} style={{ animation: "spin 0.7s linear infinite" }} /> : <Save size={13} />} Save
              </button>
              <button
                onClick={cancel}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#64748B",
                  background: "#fff",
                  border: "1.5px solid #E8EAFF",
                  borderRadius: 9,
                  cursor: "pointer",
                }}
              >
                <X size={13} /> Cancel
              </button>
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {isLoading && <div style={{ padding: 24, fontSize: 13, color: "#94A3B8" }}>Loading…</div>}
          {!isLoading && filtered.length === 0 && (
            <div
              style={{
                background: "#fff",
                border: "1px solid #E8EAFF",
                borderRadius: 14,
                padding: 24,
                fontSize: 13,
                color: "#94A3B8",
              }}
            >
              No vendors yet.
            </div>
          )}
          {filtered.map((v) => (
            <div
              key={v.id}
              style={{
                background: "#fff",
                border: "1px solid #E8EAFF",
                borderRadius: 14,
                padding: "14px 18px",
                boxShadow: "0 1px 4px rgba(99,102,241,0.05)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9,
                      background: "#EEF2FF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Building2 size={16} color="#6366F1" />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", margin: "0 0 3px" }}>{v.name}</p>
                    {v.contactName && (
                      <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>{v.contactName}</p>
                    )}
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 6 }}>
                      {v.phone && <Meta icon={<Phone size={11} />} text={v.phone} />}
                      {v.email && <Meta icon={<Mail size={11} />} text={v.email} />}
                      {v.address && <Meta icon={<MapPin size={11} />} text={v.address} />}
                      {v.website && <Meta icon={<Globe size={11} />} text={v.website} />}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => startEdit(v)} style={iconBtnStyle()}>
                    <Edit3 size={13} />
                  </button>
                  <button onClick={() => remove(v.id)} style={iconBtnStyle(true)}>
                    {deletingId === v.id ? (
                      <Loader size={13} style={{ animation: "spin 0.7s linear infinite" }} />
                    ) : (
                      <Trash2 size={13} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Toaster toasts={toasts} onRemove={removeToast} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 5 }}>
        {label}
        {required && <span style={{ color: "#DC2626" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function Meta({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748B" }}>
      {icon} {text}
    </span>
  );
}

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    boxSizing: "border-box",
    fontSize: 13,
    padding: "9px 11px",
    borderRadius: 9,
    border: "1.5px solid #E8EAFF",
    background: "#FAFBFF",
    outline: "none",
    fontFamily: "inherit",
  };
}

function iconBtnStyle(danger?: boolean): React.CSSProperties {
  return {
    width: 30,
    height: 30,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    border: `1.5px solid ${danger ? "#FECACA" : "#E8EAFF"}`,
    background: "#fff",
    color: danger ? "#DC2626" : "#64748B",
    cursor: "pointer",
  };
}