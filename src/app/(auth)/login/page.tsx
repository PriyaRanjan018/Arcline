"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "next/navigation";
import PageTransition from "@/components/shared/PageTransition";
import ArcloneMonogram from "@/components/shared/ArcloneMonogram";
import ArclineLogo from "@/components/shared/ArclineLogo";

function LoginForm() {
  const { signInWithGitHub, signInWithGoogle, signInWithMagicLink } = useAuth();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const errorMessageParam = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(errorMessageParam ? "error" : "idle");
  const [errorMessage, setErrorMessage] = useState(
    errorMessageParam === "email_exists" 
      ? "An account with this email already exists but automatic linking is disabled. Please log in with the original provider."
      : errorMessageParam || ""
  );

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    
    const { error } = await signInWithMagicLink(email, next);
    if (error) {
      setStatus("error");
      setErrorMessage(error);
    } else {
      setStatus("success");
    }
  };

  return (
    <PageTransition className="flex h-screen overflow-hidden bg-[#080808]">
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
          <Link href="/">
            <ArclineLogo size="sm" />
          </Link>
        </div>
        <div className="absolute top-8 right-8">
          <Link href="/" className="text-[0.75rem] font-body text-[#888888] hover:text-[#F2EDE4] transition-colors">
            &larr; Back to Arcline
          </Link>
        </div>

        <div className="w-full max-w-[380px] flex flex-col items-center overflow-y-auto custom-scrollbar">
          <div className="md:hidden mb-12">
            <ArclineLogo size="md" />
          </div>
          
          <h2 className="font-display font-bold text-[1.6rem] text-[#F2EDE4] mb-2">Welcome back.</h2>
          <p className="font-body font-light text-[0.85rem] text-[#888888] mb-8 text-center">
            Or join 2,847 builders documenting honestly.
          </p>

          <div className="w-full space-y-[8px] mb-8">
            <button 
              onClick={() => signInWithGoogle(next)}
              className="w-full h-[44px] flex items-center justify-center gap-3 bg-[#F2EDE4] text-[#111111] font-body font-medium text-[0.85rem] hover:bg-white transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
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

          <form onSubmit={handleMagicLink} className="w-full flex flex-col gap-[8px]">
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full h-[44px] bg-[#111111] border border-[#222222] font-body text-[0.85rem] text-[#F2EDE4] px-4 focus:outline-none focus:border-[#E8572A] transition-colors placeholder-[#444444]"
            />
            
            <button 
              type="submit" 
              disabled={status === "loading" || status === "success"}
              className="w-full h-[44px] bg-[#E8572A] flex items-center justify-center font-body font-medium text-[0.85rem] text-white hover:bg-[#D14820] transition-colors disabled:opacity-50"
            >
              {status === "loading" ? "Sending..." : "Send magic link →"}
            </button>
          </form>

          {status === "success" && (
            <div className="mt-4 p-3 bg-[#E8572A]/10 border border-[#E8572A]/30 text-[#E8572A] text-[0.8rem] w-full text-center font-body">
              Magic link sent! Check your email.
            </div>
          )}

          {status === "error" && (
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
