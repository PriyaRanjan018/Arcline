"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "next/navigation";
import PageTransition from "@/components/shared/PageTransition";
import ArcloneMonogram from "@/components/shared/ArcloneMonogram";
import ArclineLogo from "@/components/shared/ArclineLogo";

// Extend window to hold the Turnstile API injected by the CDN script
declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      getResponse: (widgetId: string) => string | undefined;
    };
  }
}

function ProviderModal({ provider, onCancel, onContinue }: { provider: 'google' | 'github', onCancel: () => void, onContinue: () => void }) {
  const providerName = provider === 'google' ? 'Google' : 'GitHub';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-[#111111] border border-[#222222] p-6 shadow-2xl flex flex-col gap-4">
        <h3 className="font-display font-bold text-xl text-[#F2EDE4]">Registered with {providerName}</h3>
        <p className="font-body text-sm text-[#888888]">
          This email is already associated with a {providerName} account. Please continue using {providerName} Sign-In.
        </p>
        <div className="flex gap-3 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 h-10 border border-[#333333] text-[#F2EDE4] font-body text-sm hover:bg-[#222222] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onContinue}
            className="flex-1 h-10 bg-[#E8572A] text-white font-body text-sm hover:bg-[#D14820] transition-colors"
          >
            Continue with {providerName}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Step 2: CAPTCHA + Send OTP panel ─────────────────────────────────────────
function CaptchaStep({
  email,
  onBack,
  onSent,
}: {
  email: string;
  onBack: () => void;
  onSent: () => void;
}) {
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const widgetIdRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const { signInWithGoogle, signInWithGitHub } = useAuth();

  // Render the Turnstile widget once the CDN script is ready
  const renderWidget = () => {
    if (!containerRef.current || !window.turnstile) return;
    if (widgetIdRef.current) return; // already rendered

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!,
      theme: "dark",
      callback: (token: string) => setCaptchaToken(token),
      "expired-callback": () => setCaptchaToken(null),
      "error-callback": () => setCaptchaToken(null),
    });
  };

  useEffect(() => {
    // If script already loaded before this component mounted
    if (window.turnstile) {
      renderWidget();
    }
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async () => {
    if (!captchaToken) {
      setStatus("error");
      setErrorMessage("Please complete the CAPTCHA first.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, captchaToken }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");

      onSent();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setStatus("error");
      setErrorMessage(msg);
      // Reset the Turnstile widget so user can retry
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
        setCaptchaToken(null);
      }
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Back + email summary */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-[#888888] hover:text-[#F2EDE4] transition-colors text-sm font-body">
          ← Back
        </button>
        <span className="text-[#555555] font-body text-sm">|</span>
        <span className="text-[#888888] font-body text-sm truncate">{email}</span>
      </div>

      <div>
        <h2 className="font-display font-bold text-[1.4rem] text-[#F2EDE4] mb-1">Verify you're human</h2>
        <p className="font-body font-light text-[0.82rem] text-[#888888]">
          Complete the check below, then we'll send a 6-digit code to your inbox.
        </p>
      </div>

      {/* Turnstile widget container */}
      <div
        ref={containerRef}
        className="w-full"
        id="turnstile-widget"
      />

      {/* Turnstile script — loads once, renders into the container above */}
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onLoad={renderWidget}
      />

      {status === "error" && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-[0.8rem] text-center font-body">
          {errorMessage}
        </div>
      )}

      <button
        onClick={handleSend}
        disabled={!captchaToken || status === "loading"}
        className="w-full h-[44px] bg-[#E8572A] flex items-center justify-center font-body font-medium text-[0.85rem] text-white hover:bg-[#D14820] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {status === "loading" ? "Sending code…" : "Send verification code →"}
      </button>
    </div>
  );
}

// ── Step 3: OTP input boxes (inline, no page redirect) ────────────────────────
function OtpStep({ email, next }: { email: string; next: string }) {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  // Auto-submit when all 6 digits filled
  useEffect(() => {
    if (otp.every(d => d !== "") && status === "idle") {
      handleVerify(otp.join(""));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const handleChange = (i: number, val: string) => {
    if (!/^[0-9]*$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otp[i] && i > 0) inputRefs.current[i - 1]?.focus();
      else { const n = [...otp]; n[i] = ""; setOtp(n); }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const chars = e.clipboardData.getData("text").slice(0, 6).split("");
    const next = [...otp];
    chars.forEach((c, i) => { if (/^[0-9]$/.test(c) && i < 6) next[i] = c; });
    setOtp(next);
    const lastFilled = chars.length - 1;
    inputRefs.current[Math.min(lastFilled + 1, 5)]?.focus();
  };

  const handleVerify = async (token: string) => {
    if (token.length < 6) { setStatus("error"); setErrorMessage("Please enter all 6 digits."); return; }
    setStatus("loading"); setErrorMessage("");
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
      if (error) throw new Error(error.message);
      if (data.session) {
        setStatus("success");
        setTimeout(async () => {
          const { data: profile } = await supabase.from("profiles").select("id,username").eq("id", data.session!.user.id).single();
          router.push(!profile?.username ? "/onboarding" : next);
        }, 800);
      } else throw new Error("Authentication failed.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed.";
      setStatus("error");
      setErrorMessage(
        msg.toLowerCase().includes("expired") ? "This code has expired. Please request a new one." :
        msg.toLowerCase().includes("invalid") ? "Invalid code. Please check and try again." :
        msg
      );
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setErrorMessage(""); setOtp(["", "", "", "", "", ""]);
    // Resend without CAPTCHA token — for simplicity on resend we still call the API
    // but without re-showing the widget. The server-side rate limit protects against abuse.
    await fetch("/api/auth/send-otp-resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setCountdown(60);
    inputRefs.current[0]?.focus();
  };

  return (
    <div className="w-full flex flex-col items-center gap-6">
      <div>
        <h2 className="font-display font-bold text-[1.4rem] text-[#F2EDE4] mb-1 text-center">Check your inbox</h2>
        <p className="font-body font-light text-[0.82rem] text-[#888888] text-center">
          We sent a 6-digit code to <span className="text-[#F2EDE4] font-medium">{email}</span>
        </p>
      </div>

      <div className="flex justify-between w-full gap-2" onPaste={handlePaste}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={el => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={digit}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            disabled={status === "loading" || status === "success"}
            className="w-full h-[55px] bg-[#080808] border border-[#333333] text-[#F2EDE4] text-xl text-center font-mono focus:outline-none focus:border-[#E8572A] transition-colors disabled:opacity-50"
          />
        ))}
      </div>

      {status === "error" && (
        <div className="w-full p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-[0.8rem] text-center font-body">
          {errorMessage}
        </div>
      )}

      {status === "success" && (
        <div className="w-full p-3 bg-green-500/10 border border-green-500/30 text-green-500 text-[0.8rem] text-center font-body flex items-center justify-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
          Verified! Redirecting…
        </div>
      )}

      <button
        onClick={() => handleVerify(otp.join(""))}
        disabled={status === "loading" || status === "success" || otp.some(d => d === "")}
        className="w-full h-[44px] bg-[#E8572A] flex items-center justify-center font-body font-medium text-[0.85rem] text-white hover:bg-[#D14820] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {status === "loading" ? "Verifying…" : "Verify code →"}
      </button>

      <div className="text-center font-body text-sm text-[#888888]">
        Didn't receive it?{" "}
        {countdown > 0 ? (
          <span className="text-[#555555]">Resend in {countdown}s</span>
        ) : (
          <button onClick={handleResend} className="text-[#E8572A] hover:underline focus:outline-none">
            Resend now
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main login form ────────────────────────────────────────────────────────────
type LoginStep = "email" | "captcha" | "otp";

function LoginForm() {
  const { signInWithGitHub, signInWithGoogle } = useAuth();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const errorMessageParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [step, setStep] = useState<LoginStep>("email");
  const [checkStatus, setCheckStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState(
    errorMessageParam === "email_exists"
      ? "An account with this email already exists but automatic linking is disabled. Please log in with the original provider."
      : errorMessageParam || ""
  );
  const [showModal, setShowModal] = useState<"google" | "github" | null>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setCheckStatus("error");
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setCheckStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to check email");

      if (data.provider === "google") { setShowModal("google"); setCheckStatus("idle"); return; }
      if (data.provider === "github") { setShowModal("github"); setCheckStatus("idle"); return; }

      // Not an OAuth account → show CAPTCHA step
      setStep("captcha");
      setCheckStatus("idle");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setCheckStatus("error");
      setErrorMessage(msg);
    }
  };

  return (
    <PageTransition className="flex h-screen overflow-hidden bg-[#080808]">
      {showModal && (
        <ProviderModal
          provider={showModal}
          onCancel={() => setShowModal(null)}
          onContinue={() => {
            setShowModal(null);
            showModal === "google" ? signInWithGoogle(next) : signInWithGitHub(next);
          }}
        />
      )}

      {/* LEFT PANEL */}
      <div className="hidden md:flex flex-col justify-center w-[40%] h-full border-r border-[#222222] p-[48px] bg-[#0D0D0D] relative overflow-hidden">
        <div className="absolute -left-[20%] top-1/2 -translate-y-1/2 opacity-[0.04] pointer-events-none">
          <ArcloneMonogram size={600} />
        </div>
        <div className="relative z-10 flex flex-col items-start gap-12">
          <ArclineLogo size="lg" />
          <h1 className="font-display font-bold text-[2.5rem] leading-[1.1] text-[#F2EDE4]">
            Real builders <br />
            <span className="italic text-[#E8572A]">document the real journey.</span>
          </h1>
          <div className="flex gap-3">
            <span className="px-3 py-1 bg-win/10 border border-win/20 text-win font-mono text-[0.65rem] tracking-widest uppercase">Win</span>
            <span className="px-3 py-1 bg-setback/10 border border-setback/20 text-setback font-mono text-[0.65rem] tracking-widest uppercase">Setback</span>
            <span className="px-3 py-1 bg-milestone/10 border border-milestone/20 text-milestone font-mono text-[0.65rem] tracking-widest uppercase">Milestone</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex flex-col items-center justify-center w-full md:w-[60%] h-full overflow-hidden p-[48px] relative">
        <div className="absolute top-8 left-8 hidden md:block">
          <Link href="/"><ArclineLogo size="sm" /></Link>
        </div>
        <div className="absolute top-8 right-8">
          <Link href="/" className="text-[0.75rem] font-body text-[#888888] hover:text-[#F2EDE4] transition-colors">
            ← Back to Arcline
          </Link>
        </div>

        <div className="w-full max-w-[380px] flex flex-col items-center overflow-y-auto custom-scrollbar">
          <div className="md:hidden mb-12">
            <ArclineLogo size="md" />
          </div>

          {/* ── Step 1: Email + OAuth ──────────────────────────────────── */}
          {step === "email" && (
            <>
              <h2 className="font-display font-bold text-[1.6rem] text-[#F2EDE4] mb-2">Welcome back.</h2>
              <p className="font-body font-light text-[0.85rem] text-[#888888] mb-8 text-center">
                Or join 2,847 builders documenting honestly.
              </p>

              <div className="w-full space-y-[8px] mb-8">
                <button
                  onClick={() => signInWithGoogle(next)}
                  className="w-full h-[44px] flex items-center justify-center gap-3 bg-[#F2EDE4] text-[#111111] font-body font-medium text-[0.85rem] hover:bg-white transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Continue with Google
                </button>
                <button
                  onClick={() => signInWithGitHub(next)}
                  className="w-full h-[44px] flex items-center justify-center gap-3 bg-[#222222] text-[#F2EDE4] font-body font-medium text-[0.85rem] hover:bg-[#333333] transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  Continue with GitHub
                </button>
              </div>

              <div className="w-full flex items-center gap-4 mb-8">
                <div className="flex-1 h-[1px] bg-[#333333]" />
                <span className="font-body text-[0.75rem] text-[#555555]">or</span>
                <div className="flex-1 h-[1px] bg-[#333333]" />
              </div>

              <form onSubmit={handleEmailSubmit} className="w-full flex flex-col gap-[8px]" noValidate>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full h-[44px] bg-[#111111] border border-[#222222] font-body text-[0.85rem] text-[#F2EDE4] px-4 focus:outline-none focus:border-[#E8572A] transition-colors placeholder-[#444444]"
                />
                <button
                  type="submit"
                  disabled={checkStatus === "loading"}
                  className="w-full h-[44px] bg-[#E8572A] flex items-center justify-center font-body font-medium text-[0.85rem] text-white hover:bg-[#D14820] transition-colors disabled:opacity-50"
                >
                  {checkStatus === "loading" ? "Checking…" : "Continue with Email →"}
                </button>
              </form>

              {checkStatus === "error" && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-[0.8rem] w-full text-center font-body">
                  {errorMessage}
                </div>
              )}

              <div className="mt-10 flex flex-col items-center gap-2">
                <span className="font-mono text-[0.6rem] text-[#555555] text-center">
                  No password. No credit card. Free forever for builders.
                </span>
                <span className="font-body font-light text-[0.68rem] text-[#444444] text-center">
                  By continuing you agree to our Terms of Service.
                </span>
              </div>
            </>
          )}

          {/* ── Step 2: CAPTCHA ────────────────────────────────────────── */}
          {step === "captcha" && (
            <CaptchaStep
              email={email}
              onBack={() => setStep("email")}
              onSent={() => setStep("otp")}
            />
          )}

          {/* ── Step 3: OTP boxes ──────────────────────────────────────── */}
          {step === "otp" && (
            <OtpStep email={email} next={next} />
          )}
        </div>
      </div>
    </PageTransition>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-[#080808]" />}>
      <LoginForm />
    </Suspense>
  );
}
