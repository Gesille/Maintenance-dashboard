/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { WorkOrderSidebar } from "@/component/Sidebar";
import {
  useUpdateAvatarMutation,
  useEditeProfileMutation,
  useUpdatePasswordMutation,
} from "@/redux/user/userApi";
import {
  Camera,
  User,
  Mail,
  Phone,
  Lock,
  LogOut,
  Check,
  AlertCircle,
  Loader,
  Eye,
  EyeOff,
  Shield,
  ChevronRight,
} from "lucide-react";
import { userLoggedOut } from "@/redux/auth/authSlice";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Toast {
  type: "success" | "error";
  message: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const user = useSelector((state: any) => state.auth.user);

  const [updateAvatar, { isLoading: avatarLoading }] = useUpdateAvatarMutation();
  const [editProfile, { isLoading: profileLoading }] = useEditeProfileMutation();
  const [updatePassword, { isLoading: passwordLoading }] = useUpdatePasswordMutation();
const dispatch = useDispatch();
  // Profile state
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");

  // Password state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // UI state
  const [toast, setToast] = useState<Toast | null>(null);
  const [activeSection, setActiveSection] = useState<"profile" | "security">("profile");
  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = (type: Toast["type"], message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await updateAvatar(reader.result as string).unwrap();
        showToast("success", "Profile photo updated");
      } catch {
        showToast("error", "Failed to update photo");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSave = async () => {
    if (!name.trim()) return showToast("error", "Name is required");
    try {
      await editProfile({ name }).unwrap();
      showToast("success", "Profile updated");
    } catch {
      showToast("error", "Failed to update profile");
    }
  };

  const handlePasswordSave = async () => {
    if (!oldPassword || !newPassword || !confirmPassword)
      return showToast("error", "All password fields are required");
    if (newPassword.length < 6)
      return showToast("error", "New password must be at least 6 characters");
    if (newPassword !== confirmPassword)
      return showToast("error", "Passwords do not match");
    try {
      await updatePassword({ oldPassword, newPassword }).unwrap();
      showToast("success", "Password changed");
      setOldPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch {
      showToast("error", "Incorrect current password");
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const avatarUrl = user?.avatar?.url;
  const userInitials = initials(user?.name ?? "?");
  const accent = "#6366F1";

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#F8FAFF" }}>
      <WorkOrderSidebar user={user} />

      <main style={{ flex: 1, overflowY: "auto", padding: "40px 48px" }}>
        {/* ── Page header ── */}
        <div style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 11, color: "#A5B4FC", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 6px" }}>
            Account
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0F172A", margin: 0, letterSpacing: "-0.03em" }}>
            Profile settings
          </h1>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 28, alignItems: "start", maxWidth: 900 }}>

          {/* ── Left: avatar card ── */}
          <div>
            <div style={{ background: "#fff", border: "1px solid #E8EAFF", borderRadius: 18, padding: 28, textAlign: "center", boxShadow: "0 2px 12px rgba(99,102,241,0.07)" }}>

              {/* Avatar */}
              <div style={{ position: "relative", display: "inline-block", marginBottom: 16 }}>
                <div style={{
                  width: 88, height: 88, borderRadius: "50%",
                  background: avatarUrl ? "transparent" : "linear-gradient(135deg, #6366F1, #8B5CF6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 28, fontWeight: 700, color: "#fff",
                  boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
                  overflow: "hidden",
                  border: "3px solid #fff",
                  outline: "3px solid #E0E7FF",
                }}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt={user?.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : userInitials}
                </div>

                {/* Camera button */}
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={avatarLoading}
                  style={{
                    position: "absolute", bottom: 0, right: 0,
                    width: 28, height: 28, borderRadius: "50%",
                    background: accent, border: "2px solid #fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", boxShadow: "0 2px 8px rgba(99,102,241,0.4)",
                  }}
                >
                  {avatarLoading
                    ? <Loader size={12} color="#fff" style={{ animation: "spin 0.7s linear infinite" }} />
                    : <Camera size={12} color="#fff" />}
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
              </div>

              <p style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: "0 0 2px", letterSpacing: "-0.02em" }}>
                {user?.name ?? "—"}
              </p>
              <p style={{ fontSize: 12, color: "#94A3B8", margin: "0 0 16px" }}>
                {user?.email ?? "—"}
              </p>

              {/* Role badge */}
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 11, fontWeight: 700,
                background: "#EEF2FF", color: "#4338CA",
                border: "1px solid #C7D2FE",
                padding: "4px 12px", borderRadius: 99,
                letterSpacing: "0.04em", textTransform: "capitalize",
              }}>
                <Shield size={11} />
                {user?.role ?? "user"}
              </span>

              {/* Section nav */}
              <div style={{ marginTop: 24, borderTop: "1px solid #F0F4FF", paddingTop: 16, display: "flex", flexDirection: "column", gap: 4 }}>
                {([
                  { key: "profile", label: "Profile", icon: <User size={13} /> },
                  { key: "security", label: "Security", icon: <Lock size={13} /> },
                ] as const).map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveSection(key)}
                    style={{
                      display: "flex", alignItems: "center", gap: 9,
                      padding: "9px 13px", borderRadius: 10, border: "none",
                      background: activeSection === key ? "#EEF2FF" : "transparent",
                      color: activeSection === key ? accent : "#64748B",
                      fontSize: 13, fontWeight: activeSection === key ? 600 : 400,
                      cursor: "pointer", textAlign: "left",
                      transition: "all 0.15s",
                    }}
                  >
                    {icon}
                    <span style={{ flex: 1 }}>{label}</span>
                    <ChevronRight size={12} color={activeSection === key ? accent : "#CBD5E1"} />
                  </button>
                ))}
              </div>

              {/* Logout */}
              <div style={{ marginTop: 8, borderTop: "1px solid #F0F4FF", paddingTop: 12 }}>
                <button
                  style={{
                    display: "flex", alignItems: "center", gap: 9,
                    padding: "9px 13px", borderRadius: 10, border: "none",
                    background: "transparent", color: "#EF4444",
                    fontSize: 13, fontWeight: 500, cursor: "pointer",
                    width: "100%", transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#FEF2F2")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  onClick={() => dispatch(userLoggedOut())}
                >
                  <LogOut size={13} />
                  Sign out
                </button>
              </div>
            </div>

            {/* Account info card */}
            <div style={{ background: "#fff", border: "1px solid #E8EAFF", borderRadius: 18, padding: 20, marginTop: 16, boxShadow: "0 2px 12px rgba(99,102,241,0.05)" }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#A5B4FC", margin: "0 0 12px" }}>Account info</p>
              <InfoRow icon={<Mail size={12} color="#A5B4FC" />} label="Email" value={user?.email ?? "—"} />
              <InfoRow icon={<User size={12} color="#A5B4FC" />} label="Member since" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—"} />
              <InfoRow icon={<Shield size={12} color="#A5B4FC" />} label="Verified" value={user?.isVerified ? "Yes" : "No"} />
            </div>
          </div>

          {/* ── Right: form panels ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {activeSection === "profile" && (
              <FormCard title="Personal information" subtitle="Update your name and contact details">
                <Field label="Full name" icon={<User size={13} color="#A5B4FC" />}>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = accent; e.target.style.boxShadow = `0 0 0 3px ${accent}15`; }}
                    onBlur={(e) => { e.target.style.borderColor = "#E8EAFF"; e.target.style.boxShadow = "none"; }}
                  />
                </Field>

                <Field label="Email address" icon={<Mail size={13} color="#A5B4FC" />}>
                  <input
                    value={user?.email ?? ""}
                    disabled
                    style={{ ...inputStyle, background: "#F8FAFF", color: "#94A3B8", cursor: "not-allowed" }}
                  />
                  <p style={{ fontSize: 11, color: "#94A3B8", margin: "6px 0 0" }}>
                    Email cannot be changed here
                  </p>
                </Field>

                <Field label="Phone number" icon={<Phone size={13} color="#A5B4FC" />}>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = accent; e.target.style.boxShadow = `0 0 0 3px ${accent}15`; }}
                    onBlur={(e) => { e.target.style.borderColor = "#E8EAFF"; e.target.style.boxShadow = "none"; }}
                  />
                </Field>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                  <SaveButton onClick={handleProfileSave} loading={profileLoading} label="Save changes" accent={accent} />
                </div>
              </FormCard>
            )}

            {activeSection === "security" && (
              <FormCard title="Change password" subtitle="Use a strong password you don't use elsewhere">
                <Field label="Current password" icon={<Lock size={13} color="#A5B4FC" />}>
                  <PasswordInput
                    value={oldPassword}
                    onChange={setOldPassword}
                    show={showOld}
                    onToggle={() => setShowOld((v) => !v)}
                    placeholder="Enter current password"
                    accent={accent}
                  />
                </Field>

                <Field label="New password" icon={<Lock size={13} color="#A5B4FC" />}>
                  <PasswordInput
                    value={newPassword}
                    onChange={setNewPassword}
                    show={showNew}
                    onToggle={() => setShowNew((v) => !v)}
                    placeholder="At least 6 characters"
                    accent={accent}
                  />
                  {newPassword && (
                    <PasswordStrength password={newPassword} accent={accent} />
                  )}
                </Field>

                <Field label="Confirm new password" icon={<Lock size={13} color="#A5B4FC" />}>
                  <PasswordInput
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    show={showConfirm}
                    onToggle={() => setShowConfirm((v) => !v)}
                    placeholder="Repeat new password"
                    accent={accent}
                  />
                  {confirmPassword && newPassword && (
                    <p style={{ fontSize: 11, marginTop: 5, color: confirmPassword === newPassword ? "#10B981" : "#EF4444" }}>
                      {confirmPassword === newPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                    </p>
                  )}
                </Field>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                  <SaveButton onClick={handlePasswordSave} loading={passwordLoading} label="Update password" accent={accent} />
                </div>
              </FormCard>
            )}
          </div>
        </div>
      </main>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 999,
          display: "flex", alignItems: "center", gap: 10,
          background: toast.type === "success" ? "#0F172A" : "#FEF2F2",
          color: toast.type === "success" ? "#fff" : "#DC2626",
          border: `1px solid ${toast.type === "success" ? "#1E293B" : "#FECACA"}`,
          padding: "12px 18px", borderRadius: 12,
          fontSize: 13, fontWeight: 500,
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          animation: "slideUp 0.2s ease",
        }}>
          {toast.type === "success"
            ? <Check size={15} color="#34D399" />
            : <AlertCircle size={15} />}
          {toast.message}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function FormCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E8EAFF", borderRadius: 18, padding: 32, boxShadow: "0 2px 12px rgba(99,102,241,0.06)" }}>
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid #F0F4FF" }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: "0 0 4px", letterSpacing: "-0.02em" }}>{title}</h2>
        <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>{subtitle}</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>{children}</div>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "#64748B", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>
        {icon} {label}
      </label>
      {children}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: "1px solid #F8FAFF" }}>
      {icon}
      <span style={{ fontSize: 11, color: "#94A3B8", flex: 1 }}>{label}</span>
      <span style={{ fontSize: 12, color: "#334155", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function PasswordInput({ value, onChange, show, onToggle, placeholder, accent }: {
  value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void;
  placeholder: string; accent: string;
}) {
  return (
    <div style={{ position: "relative" }}>
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ ...inputStyle, paddingRight: 40 }}
        onFocus={(e) => { e.target.style.borderColor = accent; e.target.style.boxShadow = `0 0 0 3px ${accent}15`; }}
        onBlur={(e) => { e.target.style.borderColor = "#E8EAFF"; e.target.style.boxShadow = "none"; }}
      />
      <button
        type="button"
        onClick={onToggle}
        style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8", display: "flex" }}
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}

function PasswordStrength({ password, accent }: { password: string; accent: string }) {
  const score =
    (password.length >= 8 ? 1 : 0) +
    (/[A-Z]/.test(password) ? 1 : 0) +
    (/[0-9]/.test(password) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(password) ? 1 : 0);

  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "#EF4444", "#F59E0B", "#3B82F6", "#10B981"];

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= score ? colors[score] : "#E8EAFF", transition: "background 0.2s" }} />
        ))}
      </div>
      <p style={{ fontSize: 11, color: colors[score], margin: 0, fontWeight: 500 }}>{labels[score]}</p>
    </div>
  );
}

function SaveButton({ onClick, loading, label, accent }: { onClick: () => void; loading: boolean; label: string; accent: string }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        display: "inline-flex", alignItems: "center", gap: 7,
        padding: "10px 22px", background: loading ? "#E8EAFF" : accent,
        color: loading ? "#A5B4FC" : "#fff", border: "none", borderRadius: 10,
        fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
        boxShadow: loading ? "none" : `0 4px 14px ${accent}40`,
        transition: "all 0.15s",
      }}
    >
      {loading
        ? <Loader size={13} style={{ animation: "spin 0.7s linear infinite" }} />
        : <Check size={13} />}
      {label}
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 14px",
  fontSize: 13,
  color: "#0F172A",
  background: "#FAFBFF",
  border: "1.5px solid #E8EAFF",
  borderRadius: 10,
  outline: "none",
  fontFamily: "inherit",
  transition: "border-color 0.15s, box-shadow 0.15s",
};