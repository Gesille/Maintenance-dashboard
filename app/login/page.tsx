/* eslint-disable react-hooks/static-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef } from "react";
import {
  Eye,
  EyeOff,
  ArrowRight,
  Lock,
  ShieldCheck,
  Settings,
  BarChart2,
  Users,
  Loader2,
} from "lucide-react";
import {
  useActivationMutation,
  useLoginMutation,
  useRegisterMutation,
} from "@/redux/auth/authApi";
import store from "@/redux/store";
import { Toaster } from "@/component/Toaster";
import { useToast } from "@/types/useToast";
import { useRouter } from "next/navigation";

const NAVY = "#1B2A4A";
const NAVY_DEEP = "#111D33";
const BLUE_MID = "#2C4A7C";
const ACCENT = "#2563EB";
const ACCENT_HOVER = "#1D4ED8";
const BORDER = "#D9DDE6";
const MUTED = "#6B7280";
const BG = "#F4F6FA";

export default function LoginPage() {
  const { toasts, addToast, removeToast } = useToast();
const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [otpError, setOtpError] = useState(false);

  // Inline field-level errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const [login, { isLoading: loginLoading }] = useLoginMutation();
  const [register, { isLoading: registerLoading }] = useRegisterMutation();
  const [activation, { isLoading: activationLoading }] = useActivationMutation();

  // ── Styles ──────────────────────────────────────────────
  const field = (name: string) => ({
    width: "100%",
    height: "44px",
    border: `1px solid ${fieldErrors[name] ? "#EF4444" : focused === name ? ACCENT : BORDER}`,
    borderRadius: "4px",
    padding: "0 12px",
    fontSize: "14px",
    color: NAVY_DEEP,
    background: fieldErrors[name] ? "#FEF2F2" : "#fff",
    outline: "none",
    boxSizing: "border-box" as const,
    fontFamily: "'Inter', sans-serif",
    transition: "border-color 0.15s",
    boxShadow:
      focused === name && !fieldErrors[name]
        ? `0 0 0 3px rgba(37,99,235,0.1)`
        : "none",
  });

  // ── Validation ───────────────────────────────────────────
  const validateLogin = () => {
    const errors: Record<string, string> = {};
    if (!email.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = "Enter a valid email";
    if (!password) errors.password = "Password is required";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRegister = () => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Full name is required";
    if (!email.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = "Enter a valid email";
    if (!password) errors.password = "Password is required";
    else if (password.length < 8) errors.password = "Minimum 8 characters";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── OTP helpers ──────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpError(false);
    if (value && index < 3) otpRefs[index + 1].current?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (pasted.length === 4) {
      setOtp(pasted.split(""));
      otpRefs[3].current?.focus();
    }
    e.preventDefault();
  };

  // ── Handlers ─────────────────────────────────────────────
  const handleLogin = async () => {
    if (!validateLogin()) return;

    try {
      await login({ email, password }).unwrap();

      addToast("Signed in successfully. Redirecting…", "success");

      setTimeout(() => {
        router.push("/dashboard/work-orders");
      }, 800);
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        "Sign-in failed. Check your credentials.";

      addToast(msg, "error");
    }
  };
  const handleRegisterSubmit = async () => {
    if (!validateRegister()) return;
    try {
      await register({ email, password, name }).unwrap();
      addToast("Verification code sent to your email.", "info");
      setShowOTP(true);
      setOtp(["", "", "", ""]);
      setOtpError(false);
      setTimeout(() => otpRefs[0].current?.focus(), 100);
    } catch (err: any) {
      const msg = err?.data?.message || "Registration failed. Please try again.";
      addToast(msg, "error");
    }
  };

  const handleVerify = async () => {
    if (otp.join("").length < 4) {
      setOtpError(true);
      return;
    }
    try {
      await activation({
        activationToken: store.getState().auth.token,
        activationCode: otp.join(""),
      }).unwrap();
      addToast("Account activated! You can now sign in.", "success");
      setShowOTP(false);
      setIsRegister(false);
      setEmail("");
      setPassword("");
      setName("");
    } catch (err: any) {
      setOtpError(true);
      const msg = err?.data?.message || "Invalid code. Please try again.";
      addToast(msg, "error");
    }
  };

  const handleResendCode = async () => {
    try {
      await register({ email, password, name }).unwrap();
      setOtp(["", "", "", ""]);
      setOtpError(false);
      addToast("A new code has been sent to your email.", "info");
      setTimeout(() => otpRefs[0].current?.focus(), 50);
    } catch {
      addToast("Could not resend code. Please try again.", "error");
    }
  };

  const switchMode = () => {
    setIsRegister(!isRegister);
    setFieldErrors({});
    setEmail("");
    setPassword("");
    setName("");
  };

  // ── FieldError helper ─────────────────────────────────────
  const FieldError = ({ name }: { name: string }) =>
    fieldErrors[name] ? (
      <p style={{ fontSize: "12px", color: "#EF4444", margin: "4px 0 0", fontFamily: "'Inter', sans-serif" }}>
        {fieldErrors[name]}
      </p>
    ) : null;

  return (
    <>
      <Toaster toasts={toasts} onRemove={removeToast} />

      <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Inter', sans-serif", WebkitFontSmoothing: "antialiased" }}>
        {/* ── LEFT PANEL ── */}
        <div
          className="hidden lg:flex"
          style={{
            width: "46%",
            background: NAVY,
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "52px 56px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "72px" }}>
              <div
                style={{
                  width: "42px", height: "42px", borderRadius: "6px",
                  background: BLUE_MID, border: "1px solid rgba(255,255,255,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Settings size={20} color="#93B4FF" />
              </div>
              <div>
                <p style={{ color: "#fff", fontWeight: 700, fontSize: "16px", margin: 0, letterSpacing: "-0.01em" }}>
                  MaintenancePro
                </p>
                <p style={{ color: "#7A94C1", fontSize: "11px", margin: 0, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Enterprise Platform
                </p>
              </div>
            </div>

            <div style={{ marginBottom: "52px" }}>
              <h2 style={{ fontSize: "36px", fontWeight: 800, color: "#fff", lineHeight: 1.15, letterSpacing: "-0.025em", margin: "0 0 16px" }}>
                Operational excellence<br />
                <span style={{ color: "#93B4FF" }}>starts here.</span>
              </h2>
              <p style={{ color: "#7A94C1", fontSize: "15px", lineHeight: 1.7, margin: 0, maxWidth: "320px" }}>
                A unified platform for maintenance teams — work orders, asset tracking, preventive schedules, and full Odoo ERP integration.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {[
                { icon: BarChart2, title: "Real-time dashboards", desc: "Live KPIs across all assets and technicians" },
                { icon: Users, title: "Role-based access", desc: "Admins, supervisors, and field technicians" },
                { icon: ShieldCheck, title: "Audit-ready logs", desc: "Full traceability with timestamped records" },
                { icon: Lock, title: "Enterprise security", desc: "AES-256 encryption, SSO, and 2FA support" },
              ].map(({ icon: Icon, title, desc }, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: "14px",
                    padding: "16px 0",
                    borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.07)" : "none",
                  }}
                >
                  <div
                    style={{
                      width: "34px", height: "34px", borderRadius: "6px",
                      background: "rgba(147,180,255,0.1)", border: "1px solid rgba(147,180,255,0.15)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}
                  >
                    <Icon size={16} color="#93B4FF" />
                  </div>
                  <div>
                    <p style={{ color: "#D0DCF0", fontSize: "13px", fontWeight: 600, margin: "0 0 3px" }}>{title}</p>
                    <p style={{ color: "#5A7299", fontSize: "12px", margin: 0, lineHeight: 1.5 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "28px", display: "flex", gap: "32px" }}>
              {[
                { value: "99.9%", label: "Uptime SLA" },
                { value: "12,000+", label: "Assets tracked" },
                { value: "ISO 27001", label: "Certified" },
              ].map((s) => (
                <div key={s.label}>
                  <p style={{ color: "#fff", fontWeight: 700, fontSize: "18px", margin: "0 0 3px", letterSpacing: "-0.02em" }}>{s.value}</p>
                  <p style={{ color: "#5A7299", fontSize: "12px", margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ flex: 1, background: BG, display: "flex", flexDirection: "column" }}>
          {/* Top bar */}
          <div
            style={{
              height: "56px", background: "#fff", borderBottom: `1px solid ${BORDER}`,
              display: "flex", alignItems: "center", padding: "0 40px", justifyContent: "space-between",
            }}
          >
            <div className="flex lg:hidden" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Settings size={18} color={ACCENT} />
              <span style={{ color: NAVY, fontWeight: 700, fontSize: "14px" }}>MaintenancePro</span>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px" }}>
              <ShieldCheck size={14} color="#22C55E" />
              <span style={{ fontSize: "12px", color: MUTED, fontWeight: 500 }}>Secure connection</span>
            </div>
          </div>

          {/* Form area */}
          <div
            style={{
              flex: 1, display: "flex", alignItems: "center",
              justifyContent: "center", padding: "40px 24px",
            }}
          >
            <div style={{ width: "100%", maxWidth: "400px" }}>
              <div
                style={{
                  background: "#fff", border: `1px solid ${BORDER}`, borderRadius: "8px",
                  padding: "40px 36px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
                }}
              >
                {/* ── OTP STEP ── */}
                {showOTP ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                      <div
                        style={{
                          width: "52px", height: "52px", borderRadius: "12px",
                          background: "#EFF6FF", border: "1px solid #BFDBFE",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <ShieldCheck size={26} color={ACCENT} />
                      </div>
                    </div>

                    <div style={{ textAlign: "center", marginBottom: "28px" }}>
                      <h1 style={{ fontSize: "22px", fontWeight: 800, color: NAVY_DEEP, letterSpacing: "-0.02em", margin: "0 0 8px" }}>
                        Verify your email
                      </h1>
                      <p style={{ color: MUTED, fontSize: "14px", margin: 0, lineHeight: 1.6 }}>
                        We sent a 4-digit code to<br />
                        <strong style={{ color: NAVY_DEEP }}>{email}</strong>
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "8px" }}>
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          ref={otpRefs[i]}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          onPaste={handleOtpPaste}
                          onFocus={() => setFocused(`otp${i}`)}
                          onBlur={() => setFocused(null)}
                          style={{
                            width: "64px", height: "64px", textAlign: "center",
                            fontSize: "24px", fontWeight: 700, color: NAVY_DEEP,
                            border: `2px solid ${otpError ? "#EF4444" : focused === `otp${i}` ? ACCENT : BORDER}`,
                            borderRadius: "8px",
                            background: otpError ? "#FEF2F2" : "#fff",
                            outline: "none", fontFamily: "'Inter', sans-serif",
                            transition: "border-color 0.15s, background 0.15s",
                            boxShadow: focused === `otp${i}` && !otpError ? `0 0 0 3px rgba(37,99,235,0.1)` : "none",
                            caretColor: ACCENT,
                          }}
                        />
                      ))}
                    </div>

                    {otpError && (
                      <p style={{ textAlign: "center", fontSize: "13px", color: "#EF4444", margin: "8px 0 0" }}>
                        Enter all 4 digits to continue.
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={handleVerify}
                      disabled={activationLoading}
                      style={{
                        width: "100%", height: "44px", borderRadius: "4px",
                        background: activationLoading ? "#93C5FD" : ACCENT,
                        color: "#fff", fontSize: "14px", fontWeight: 700,
                        border: "none", cursor: activationLoading ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        gap: "8px", marginTop: "24px", fontFamily: "'Inter', sans-serif",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => { if (!activationLoading) e.currentTarget.style.background = ACCENT_HOVER; }}
                      onMouseLeave={(e) => { if (!activationLoading) e.currentTarget.style.background = ACCENT; }}
                    >
                      {activationLoading ? (
                        <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Verifying…</>
                      ) : (
                        <>Activate account <ArrowRight size={16} /></>
                      )}
                    </button>

                    <p style={{ textAlign: "center", fontSize: "13px", color: MUTED, marginTop: "20px", marginBottom: 0 }}>
                      Didn&apos;t receive a code?{" "}
                      <button
                        type="button"
                        onClick={handleResendCode}
                        style={{
                          background: "none", border: "none", color: ACCENT,
                          fontWeight: 600, fontSize: "13px", cursor: "pointer",
                          padding: 0, fontFamily: "'Inter', sans-serif",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = ACCENT_HOVER)}
                        onMouseLeave={(e) => (e.currentTarget.style.color = ACCENT)}
                      >
                        Resend code
                      </button>
                    </p>

                    <p style={{ textAlign: "center", fontSize: "13px", color: MUTED, marginTop: "10px", marginBottom: 0 }}>
                      <button
                        type="button"
                        onClick={() => setShowOTP(false)}
                        style={{
                          background: "none", border: "none", color: MUTED,
                          fontWeight: 500, fontSize: "13px", cursor: "pointer",
                          padding: 0, fontFamily: "'Inter', sans-serif", textDecoration: "underline",
                        }}
                      >
                        ← Back to registration
                      </button>
                    </p>
                  </>
                ) : (
                  <>
                    {/* ── REGISTER / LOGIN STEP ── */}
                    <div style={{ marginBottom: "28px" }}>
                      <h1 style={{ fontSize: "22px", fontWeight: 800, color: NAVY_DEEP, letterSpacing: "-0.02em", margin: "0 0 6px" }}>
                        {isRegister ? "Create account" : "Sign in"}
                      </h1>
                      <p style={{ color: MUTED, fontSize: "14px", margin: 0 }}>
                        {isRegister
                          ? "Fill in your details to request access."
                          : "Enter your credentials to access the dashboard."}
                      </p>
                    </div>

                    {/* SSO */}
                    <button
                      type="button"
                      style={{
                        width: "100%", height: "42px", borderRadius: "4px",
                        border: `1px solid ${BORDER}`, background: "#fff",
                        color: NAVY_DEEP, fontSize: "14px", fontWeight: 600,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        gap: "10px", cursor: "pointer", marginBottom: "20px",
                        fontFamily: "'Inter', sans-serif",
                        transition: "border-color 0.15s, background 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = ACCENT;
                        e.currentTarget.style.background = "#F0F5FF";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = BORDER;
                        e.currentTarget.style.background = "#fff";
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
                        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
                        <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
                        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
                      </svg>
                      Continue with Google SSO
                    </button>

                    {/* Divider */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                      <div style={{ flex: 1, height: "1px", background: BORDER }} />
                      <span style={{ color: "#C0C6D4", fontSize: "12px", fontWeight: 500 }}>or</span>
                      <div style={{ flex: 1, height: "1px", background: BORDER }} />
                    </div>

                    {/* Fields */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      {isRegister && (
                        <div>
                          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                            Full name
                          </label>
                          <input
                            type="text"
                            placeholder="John Doe"
                            style={field("name")}
                            onFocus={() => setFocused("name")}
                            onBlur={() => setFocused(null)}
                            value={name}
                            onChange={(e) => { setName(e.target.value); setFieldErrors((p) => ({ ...p, name: "" })); }}
                          />
                          <FieldError name="name" />
                        </div>
                      )}

                      <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                          Work email
                        </label>
                        <input
                          type="email"
                          placeholder="name@company.com"
                          style={field("email")}
                          onFocus={() => setFocused("email")}
                          onBlur={() => setFocused(null)}
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: "" })); }}
                        />
                        <FieldError name="email" />
                      </div>

                      <div>
                        <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>
                          Password
                        </label>
                        <div style={{ position: "relative" }}>
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            style={{ ...field("password"), paddingRight: "40px" }}
                            onFocus={() => setFocused("password")}
                            onBlur={() => setFocused(null)}
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: "" })); }}
                            onKeyDown={(e) => { if (e.key === "Enter") isRegister ? handleRegisterSubmit() : handleLogin(); }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                              position: "absolute", right: "12px", top: "50%",
                              transform: "translateY(-50%)", background: "none",
                              border: "none", color: "#9CA3AF", cursor: "pointer",
                              display: "flex", padding: 0,
                            }}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        <FieldError name="password" />
                      </div>

                      {/* Remember me */}
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", userSelect: "none" }}>
                        <div
                          onClick={() => setRememberMe(!rememberMe)}
                          style={{
                            width: "15px", height: "15px", borderRadius: "3px", flexShrink: 0,
                            cursor: "pointer",
                            border: `1.5px solid ${rememberMe ? ACCENT : "#D1D5DB"}`,
                            background: rememberMe ? ACCENT : "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.15s",
                          }}
                        >
                          {rememberMe && (
                            <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                              <path d="M1 3.5L3.5 6L8 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <span style={{ fontSize: "13px", color: MUTED }}>Keep me signed in</span>
                      </label>

                      {/* Submit */}
                      <button
                        type="button"
                        onClick={isRegister ? handleRegisterSubmit : handleLogin}
                        disabled={loginLoading || registerLoading}
                        style={{
                          width: "100%", height: "44px", borderRadius: "4px",
                          background: loginLoading || registerLoading ? "#93C5FD" : ACCENT,
                          color: "#fff", fontSize: "14px", fontWeight: 700,
                          border: "none",
                          cursor: loginLoading || registerLoading ? "not-allowed" : "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          gap: "8px", marginTop: "4px", fontFamily: "'Inter', sans-serif",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => { if (!loginLoading && !registerLoading) e.currentTarget.style.background = ACCENT_HOVER; }}
                        onMouseLeave={(e) => { if (!loginLoading && !registerLoading) e.currentTarget.style.background = ACCENT; }}
                      >
                        {isRegister ? (
                          registerLoading
                            ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Creating account…</>
                            : <>Request access <ArrowRight size={16} /></>
                        ) : (
                          loginLoading
                            ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Signing in…</>
                            : <>Sign in <ArrowRight size={16} /></>
                        )}
                      </button>
                    </div>

                    {/* Switch mode */}
                    <p style={{ textAlign: "center", fontSize: "13px", color: MUTED, marginTop: "24px", marginBottom: 0 }}>
                      {isRegister ? "Already have an account? " : "Need access? "}
                      <button
                        type="button"
                        onClick={switchMode}
                        style={{
                          background: "none", border: "none", color: ACCENT,
                          fontWeight: 600, fontSize: "13px", cursor: "pointer",
                          padding: 0, fontFamily: "'Inter', sans-serif",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = ACCENT_HOVER)}
                        onMouseLeave={(e) => (e.currentTarget.style.color = ACCENT)}
                      >
                        {isRegister ? "Sign in" : "Request access"}
                      </button>
                    </p>
                  </>
                )}
              </div>

              <p style={{ textAlign: "center", fontSize: "12px", color: "#9CA3AF", marginTop: "20px" }}>
                Authorized personnel only · © {new Date().getFullYear()} MaintenancePro Inc.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}