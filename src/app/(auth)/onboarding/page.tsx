"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import ArclineLogo from "@/components/shared/ArclineLogo";
import ArcloneMonogram from "@/components/shared/ArcloneMonogram";

const STEPS = ["Identity", "Your Build", "Done"];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Step 1 — Identity
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<null | boolean>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Step 2 — First Build
  const [buildName, setBuildName] = useState("");
  const [buildDesc, setBuildDesc] = useState("");
  const [buildStage, setBuildStage] = useState("BUILDING");

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
    // Pre-fill name from OAuth provider
    if (user?.user_metadata?.full_name) setName(user.user_metadata.full_name);
    if (user?.user_metadata?.name) setName(user.user_metadata.name);
  }, [user, loading, router]);

  // Check username availability with debounce
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();
      setUsernameAvailable(!data);
      setCheckingUsername(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [username, supabase]);

  async function handleSubmit() {
    if (!user) return;
    setSubmitting(true);
    setError("");

    try {
      // 1. Create profile
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        name,
        username: username.toLowerCase().trim(),
        bio,
        avatar_url: user.user_metadata?.avatar_url ?? null,
        is_builder: true,
      });
      if (profileError) throw new Error(profileError.message);

      // 2. Create first build if provided
      if (buildName.trim()) {
        await supabase.from("projects").insert({
          user_id: user.id,
          title: buildName.trim(),
          description: buildDesc.trim(),
          stage: buildStage,
          is_public: true,
        });
      }

      router.push(`/${username.toLowerCase().trim()}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#080808]">
        <div className="w-8 h-8 border border-accent animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col md:flex-row">
      {/* LEFT BRAND PANEL */}
      <div className="hidden md:flex flex-col justify-between w-[360px] flex-shrink-0 border-r border-[#222222] bg-[#0D0D0D] p-12 relative overflow-hidden">
        <div className="absolute -left-[30%] top-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
          <ArcloneMonogram size={600} />
        </div>
        <ArclineLogo size="lg" />

        <div className="relative z-10">
          {/* Step Progress */}
          <div className="flex flex-col gap-6 mb-12">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-4">
                <div className={`w-7 h-7 flex items-center justify-center border text-[0.65rem] font-mono transition-colors ${
                  i < step
                    ? "border-accent bg-accent text-white"
                    : i === step
                    ? "border-accent text-accent"
                    : "border-[#333333] text-[#444444]"
                }`}>
                  {i < step ? "✓" : String(i + 1).padStart(2, "0")}
                </div>
                <span className={`font-body text-sm transition-colors ${
                  i === step ? "text-text1" : i < step ? "text-text2" : "text-text3"
                }`}>{s}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-[#222222] pt-8">
            <p className="font-body font-light text-text3 text-[0.78rem] leading-relaxed italic">
              &ldquo;Proof of Work. NOT perfection. Stop curating. Start documenting.&rdquo;
            </p>
          </div>
        </div>

        <span className="font-mono text-[0.6rem] text-[#444444]">Step {step + 1} of {STEPS.length}</span>
      </div>

      {/* RIGHT CONTENT */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[480px]">
          {/* Mobile logo */}
          <div className="md:hidden mb-10">
            <ArclineLogo size="md" />
          </div>

          {/* ── STEP 0: Identity ── */}
          {step === 0 && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="font-display font-bold text-[1.8rem] text-text1 mb-1">Set up your identity</h2>
                <p className="font-body font-light text-text2 text-sm">This is your public builder profile on Arcline.</p>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="font-mono text-[0.65rem] text-text3 uppercase tracking-widest block mb-2">Full Name *</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Priya Ranjan"
                    className="w-full h-[44px] bg-[#111111] border border-[#222222] font-body text-[0.88rem] text-text1 px-4 focus:outline-none focus:border-accent transition-colors placeholder-[#444444]"
                  />
                </div>

                <div>
                  <label className="font-mono text-[0.65rem] text-text3 uppercase tracking-widest block mb-2">Username *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-text3 text-sm">@</span>
                    <input
                      value={username}
                      onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                      placeholder="priya"
                      className="w-full h-[44px] bg-[#111111] border border-[#222222] font-mono text-[0.88rem] text-text1 pl-8 pr-4 focus:outline-none focus:border-accent transition-colors placeholder-[#444444]"
                    />
                    {username.length >= 3 && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[0.65rem]">
                        {checkingUsername ? (
                          <span className="text-text3">…</span>
                        ) : usernameAvailable ? (
                          <span className="text-win">✓ available</span>
                        ) : (
                          <span className="text-setback">✗ taken</span>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="font-mono text-[0.6rem] text-text3 mt-1.5">arcline.dev/{username || "you"}</p>
                </div>

                <div>
                  <label className="font-mono text-[0.65rem] text-text3 uppercase tracking-widest block mb-2">Bio</label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="Building in public. Failing forward."
                    rows={3}
                    maxLength={160}
                    className="w-full bg-[#111111] border border-[#222222] font-body font-light text-[0.88rem] text-text1 p-4 focus:outline-none focus:border-accent transition-colors placeholder-[#444444] resize-none"
                  />
                  <p className="font-mono text-[0.6rem] text-text3 text-right mt-1">{bio.length}/160</p>
                </div>
              </div>

              <button
                onClick={() => setStep(1)}
                disabled={!name.trim() || !username || usernameAvailable !== true}
                className="w-full h-[46px] bg-accent font-body font-medium text-[0.88rem] text-white hover:bg-[#D14820] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue →
              </button>
            </div>
          )}

          {/* ── STEP 1: First Build ── */}
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="font-display font-bold text-[1.8rem] text-text1 mb-1">What are you building?</h2>
                <p className="font-body font-light text-text2 text-sm">Log your first build. You can add more any time.</p>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="font-mono text-[0.65rem] text-text3 uppercase tracking-widest block mb-2">Build Name *</label>
                  <input
                    value={buildName}
                    onChange={e => setBuildName(e.target.value)}
                    placeholder="My SaaS MVP"
                    className="w-full h-[44px] bg-[#111111] border border-[#222222] font-body text-[0.88rem] text-text1 px-4 focus:outline-none focus:border-accent transition-colors placeholder-[#444444]"
                  />
                </div>

                <div>
                  <label className="font-mono text-[0.65rem] text-text3 uppercase tracking-widest block mb-2">Description</label>
                  <textarea
                    value={buildDesc}
                    onChange={e => setBuildDesc(e.target.value)}
                    placeholder="What are you building and why?"
                    rows={3}
                    className="w-full bg-[#111111] border border-[#222222] font-body font-light text-[0.88rem] text-text1 p-4 focus:outline-none focus:border-accent transition-colors placeholder-[#444444] resize-none"
                  />
                </div>

                <div>
                  <label className="font-mono text-[0.65rem] text-text3 uppercase tracking-widest block mb-2">Current Stage</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["IDEA", "BUILDING", "LAUNCHED"].map(s => (
                      <button
                        key={s}
                        onClick={() => setBuildStage(s)}
                        className={`h-[36px] font-mono text-[0.65rem] uppercase tracking-widest border transition-colors ${
                          buildStage === s
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-[#333333] text-text3 hover:border-[#555555]"
                        }`}
                      >{s}</button>
                    ))}
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 font-body text-[0.8rem]">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="h-[46px] px-6 border border-[#333333] font-body font-medium text-[0.88rem] text-text2 hover:border-[#555555] transition-colors"
                >← Back</button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 h-[46px] bg-accent font-body font-medium text-[0.88rem] text-white hover:bg-[#D14820] transition-colors disabled:opacity-50"
                >
                  {submitting ? "Setting up your profile…" : "Launch my profile →"}
                </button>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="font-body text-[0.78rem] text-text3 hover:text-text2 transition-colors text-center"
              >
                Skip for now — I&apos;ll add a build later
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
