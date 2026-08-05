/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Search, Plus, Shield, Trash2, X, Loader, UserPlus, Mail, Phone, Lock, Check,
} from "lucide-react";
import { WorkOrderSidebar } from "@/component/Sidebar";
import { Toaster } from "@/component/Toaster";
import { useToast } from "@/types/useToast";
import {
  ManagedUser,
  useCreateUserMutation,
  useDeleteUserMutation,
  useGetAllUsersQuery,
  useUpdateUserRoleMutation,
} from "@/redux/user/userApi";

const ROLES = ["Enduser", "technician", "manager"] as const;

const ROLE_META: Record<string, { bg: string; text: string; border: string }> = {
  manager:    { bg: "#EEF2FF", text: "#4338CA", border: "#C7D2FE" },
  technician: { bg: "#F0FDFA", text: "#0F766E", border: "#99F6E4" },
  user:       { bg: "#F9FAFB", text: "#374151", border: "#E5E7EB" },
};

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

export default function UsersPage() {
  const currentUser = useSelector((state: any) => state.auth.user);
  const { data, isLoading, isError, refetch } = useGetAllUsersQuery();
  const [updateRole] = useUpdateUserRoleMutation();
  const [deleteUser] = useDeleteUserMutation();
  const { toasts, addToast, removeToast } = useToast();

  const [search, setSearch] = useState("");
  const [roleUpdatingId, setRoleUpdatingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const users: ManagedUser[] = data?.users ?? [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        q === "" ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q),
    );
  }, [users, search]);

  const handleRoleChange = async (id: string, role: string) => {
    setRoleUpdatingId(id);
    try {
      await updateRole({ id, role }).unwrap();
      addToast("Role updated", "success");
    } catch (err) {
      console.error(err);
      addToast("Failed to update role", "error");
    } finally {
      setRoleUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id).unwrap();
      addToast("User deleted", "success");
    } catch (err) {
      console.error(err);
      addToast("Failed to delete user", "error");
    } finally {
      setConfirmDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#F8FAFF" }}>
        <span style={{ fontSize: 13, color: "#94A3B8" }}>Loading users…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", alignItems: "center", justifyContent: "center", background: "#FFF5F5", gap: 12 }}>
        <span style={{ fontSize: 13, color: "#DC2626" }}>Failed to load users</span>
        <button
          onClick={refetch}
          style={{ padding: "8px 18px", background: "linear-gradient(135deg, #6366F1, #8B5CF6)", color: "#fff", border: "none", borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#F8FAFF" }}>
      <WorkOrderSidebar />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 60%, #FAF5FF 100%)",
            borderBottom: "2px solid #6366F122",
            padding: "24px 32px",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, marginBottom: 18 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: "0 0 4px", letterSpacing: "-0.03em" }}>
                Teams / Users
              </h1>
              <span style={{ fontSize: 12, color: "#64748B" }}>
                {users.length} account{users.length !== 1 ? "s" : ""}
              </span>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "9px 16px", fontSize: 12, fontWeight: 600, color: "#fff",
                background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                border: "none", borderRadius: 10, cursor: "pointer",
                boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
              }}
            >
              <UserPlus size={14} /> Add user
            </button>
          </div>

          <div
            style={{
              display: "flex", alignItems: "center", gap: 8, background: "#fff",
              borderRadius: 10, padding: "0 12px", height: 36,
              border: "1.5px solid #E0E7FF", maxWidth: 360,
            }}
          >
            <Search size={13} color="#A5B4FC" strokeWidth={2} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email…"
              style={{ border: "none", background: "transparent", fontSize: 12, color: "#0F172A", outline: "none", width: "100%" }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 20px", color: "#94A3B8", fontSize: 13 }}>
              No users found
            </div>
          ) : (
            <div style={{ background: "#fff", border: "1px solid #E8EAFF", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(99,102,241,0.06)" }}>
              {/* Header row */}
              <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr 1fr 0.8fr 0.6fr", padding: "12px 20px", background: "#FAFBFF", borderBottom: "1px solid #E8EAFF" }}>
                {["User", "Phone", "Role", "Verified", ""].map((h, i) => (
                  <span key={i} style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94A3B8" }}>
                    {h}
                  </span>
                ))}
              </div>

              {filtered.map((u) => {
                const meta = ROLE_META[u.role] ?? ROLE_META.user;
                const isSelf = currentUser?.email === u.email;
                const busy = roleUpdatingId === u._id;

                return (
                  <div
                    key={u._id}
                    style={{
                      display: "grid", gridTemplateColumns: "2.2fr 1fr 1fr 0.8fr 0.6fr",
                      alignItems: "center", padding: "14px 20px",
                      borderBottom: "1px solid #F0F4FF",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <div
                        style={{
                          width: 32, height: 32, borderRadius: "50%",
                          background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                          color: "#fff", fontSize: 11, fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}
                      >
                        {initials(u.name) || "?"}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {u.name} {isSelf && <span style={{ fontSize: 10, color: "#A5B4FC" }}>(you)</span>}
                        </p>
                        <p style={{ fontSize: 11, color: "#94A3B8", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {u.email}
                        </p>
                      </div>
                    </div>

                    <span style={{ fontSize: 12, color: "#64748B" }}>{u.phone || "—"}</span>

                    <div>
                      <select
                        value={u.role}
                        disabled={busy || isSelf}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        style={{
                          fontSize: 12, fontWeight: 600, padding: "5px 10px",
                          borderRadius: 8, border: `1.5px solid ${meta.border}`,
                          background: meta.bg, color: meta.text,
                          cursor: isSelf ? "not-allowed" : "pointer", outline: "none",
                          textTransform: "capitalize",
                        }}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      {busy && <Loader size={12} style={{ marginLeft: 6, animation: "spin 0.7s linear infinite", verticalAlign: "middle" }} />}
                    </div>

                    <div>
                      {u.isVerified ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "#15803D" }}>
                          <Check size={12} /> Yes
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: "#CBD5E1" }}>No</span>
                      )}
                    </div>

                    <div style={{ textAlign: "right" }}>
                      {!isSelf && (
                        <button
                          onClick={() => setConfirmDeleteId(u._id)}
                          title="Delete user"
                          style={{ background: "none", border: "none", color: "#CBD5E1", cursor: "pointer", padding: 4 }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#DC2626")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#CBD5E1")}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onCreated={() => {
            setShowAddModal(false);
            addToast("User created", "success");
          }}
          onError={() => addToast("Failed to create user", "error")}
        />
      )}

      {confirmDeleteId && (
        <ConfirmModal
          message="Delete this user permanently? This can't be undone."
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={() => handleDelete(confirmDeleteId)}
        />
      )}

      <Toaster toasts={toasts} onRemove={removeToast} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Add user modal ────────────────────────────────────────────────────────

function AddUserModal({
  onClose,
  onCreated,
  onError,
}: {
  onClose: () => void;
  onCreated: () => void;
  onError: () => void;
}) {
  const [createUser, { isLoading }] = useCreateUserMutation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]>("technician");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim() || !email.trim() || !password) {
      setError("Name, email and password are required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    try {
      await createUser({ name, email, phone: phone || undefined, password, role }).unwrap();
      onCreated();
    } catch (err: any) {
      setError(err?.data?.message || "Something went wrong");
      onError();
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: 420, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid #F0F4FF" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: 0 }}>Add user</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Full name" icon={<Shield size={13} color="#A5B4FC" />}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" style={inputStyle} />
          </Field>
          <Field label="Email" icon={<Mail size={13} color="#A5B4FC" />}>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@company.com" style={inputStyle} />
          </Field>
          <Field label="Phone (optional)" icon={<Phone size={13} color="#A5B4FC" />}>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 0000" style={inputStyle} />
          </Field>
          <Field label="Temporary password" icon={<Lock size={13} color="#A5B4FC" />}>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" style={inputStyle} />
          </Field>
          <Field label="Role" icon={<Shield size={13} color="#A5B4FC" />}>
            <select value={role} onChange={(e) => setRole(e.target.value as any)} style={inputStyle}>
              {ROLES.map((r) => (
                <option key={r} value={r} style={{ textTransform: "capitalize" }}>{r}</option>
              ))}
            </select>
          </Field>

          {error && <p style={{ fontSize: 12, color: "#DC2626", margin: 0 }}>{error}</p>}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "16px 22px", borderTop: "1px solid #F0F4FF" }}>
          <button
            onClick={onClose}
            style={{ padding: "8px 16px", fontSize: 12, fontWeight: 600, background: "#fff", border: "1.5px solid #E8EAFF", borderRadius: 9, color: "#64748B", cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 16px", fontSize: 12, fontWeight: 600, color: "#fff",
              background: isLoading ? "#A5B4FC" : "linear-gradient(135deg, #6366F1, #8B5CF6)",
              border: "none", borderRadius: 9, cursor: isLoading ? "not-allowed" : "pointer",
            }}
          >
            {isLoading && <Loader size={12} style={{ animation: "spin 0.7s linear infinite" }} />}
            <Plus size={13} /> Create user
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ message, onCancel, onConfirm }: { message: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: 22, width: 360, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        <p style={{ fontSize: 13, color: "#334155", margin: "0 0 18px" }}>{message}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onCancel} style={{ padding: "8px 14px", fontSize: 12, fontWeight: 600, background: "#fff", border: "1.5px solid #E8EAFF", borderRadius: 8, color: "#64748B", cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{ padding: "8px 14px", fontSize: 12, fontWeight: 600, background: "#DC2626", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer" }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>
        {icon} {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "9px 12px", fontSize: 13,
  color: "#0F172A", background: "#FAFBFF", border: "1.5px solid #E8EAFF",
  borderRadius: 9, outline: "none", fontFamily: "inherit",
};