"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageTransition from "@/components/shared/PageTransition";
import Button from "@/components/shared/Button";
import { cn } from "@/lib/utils";
import { Rocket, Wrench, AlertTriangle, Repeat, PauseCircle, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";

// ── Constants ──────────────────────────────────────────────
const STAGES = [
  { id: "BUILDING",     label: "Building",     icon: Wrench,        desc: "Actively working on it",          color: "#7EB8F5" },
  { id: "STARTED",      label: "Just Started",  icon: Rocket,        desc: "Early days, just beginning",       color: "#C9A96E" },
  { id: "STRUGGLING",   label: "Struggling",   icon: AlertTriangle, desc: "Hitting walls, pushing through",   color: "#FF9800" },
  { id: "PIVOTING",     label: "Pivoting",     icon: Repeat,        desc: "Changing direction",               color: "#C9A96E" },
  { id: "BREAKTHROUGH", label: "Breakthrough", icon: Rocket,        desc: "Major breakthrough achieved",      color: "#4CAF50" },
  { id: "LAUNCHED",     label: "Launched",     icon: Rocket,        desc: "Shipped and live",                 color: "#E8572A" },
  { id: "PAUSED",       label: "Paused",       icon: PauseCircle,   desc: "Taking a break",                  color: "#666666" },
  { id: "ABANDONED",    label: "Abandoned",    icon: AlertTriangle, desc: "No longer working on it",          color: "#444444" },
];

const CATEGORIES: { label: string; value: string }[] = [
  { label: "Startup",       value: "STARTUP"        },
  { label: "College Project",value: "COLLEGE_PROJECT" },
  { label: "Personal Build", value: "PERSONAL_BUILD"  },
  { label: "Open Source",    value: "OPEN_SOURCE"     },
];

// ── Slug helpers ──────────────────────────────────────────
function toSlug(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
}

// ── Page ──────────────────────────────────────────────────
export default function NewBuildPage() {
  const router = useRouter();

  const [step, setStep]           = useState<1 | 2 | 3>(1);
  const [title, setTitle]         = useState("");
  const [slug, setSlug]           = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [tagline, setTagline]     = useState("");
  const [description, setDesc]    = useState("");
  const [category, setCategory]   = useState("");
  const [stage, setStage]         = useState("BUILDING");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState("");
  const [done, setDone]           = useState(false);

  // Auto-generate slug from title unless user has manually edited it
  function handleTitleChange(v: string) {
    setTitle(v);
    if (!slugEdited) setSlug(toSlug(v));
  }

  function handleSlugChange(v: string) {
    setSlug(toSlug(v));
    setSlugEdited(true);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");

    // Only send optional fields if they have a value — avoids enum errors on empty strings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: Record<string, any> = { title, slug, stage };
    if (tagline.trim())     payload.tagline     = tagline.trim();
    if (description.trim()) payload.description = description.trim();
    if (category)           payload.category    = category;

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Something went wrong.");
      setSubmitting(false);
      return;
    }
    setDone(true);
    // Brief success pause, then go log an entry
    setTimeout(() => router.push("/new-entry"), 1400);
  }

  // ── Success screen ──────────────────────────────────────
  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-48px)] gap-6">
        <CheckCircle2 className="w-12 h-12 text-[#E8572A]" />
        <h2 className="text-2xl font-display font-bold">Project created.</h2>
        <p className="text-text2 text-sm">Taking you to log your first entry…</p>
      </div>
    );
  }

  return (
    <PageTransition className="p-4 md:p-8 max-w-2xl mx-auto w-full pb-36">

      {/* Header */}
      <div className="mb-10">
        <p className="font-mono text-[0.6rem] text-[#E8572A] tracking-widest uppercase mb-2">
          Step {step} of 3
        </p>
        <h1 className="text-3xl font-display font-bold">
          {step === 1 && "Name your build"}
          {step === 2 && "Tell its story"}
          {step === 3 && "Pick a stage"}
        </h1>
        <p className="text-text3 text-sm mt-2">
          {step === 1 && "Every build needs a name and a handle."}
          {step === 2 && "A one-liner and optional context go a long way."}
          {step === 3 && "Where are you right now?"}
        </p>

        {/* Progress bar */}
        <div className="mt-5 h-[3px] w-full bg-surface2">
          <div
            className="h-full bg-[#E8572A] transition-all duration-500"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* ── Step 1: Name + Slug ─────────────────────────── */}
      {step === 1 && (
        <div className="flex flex-col gap-6">
          <Field label="Project name" required>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Arcline"
              maxLength={80}
              className="w-full bg-surface border border-border px-4 py-3 text-text1 font-body text-base
                         placeholder:text-text3 outline-none focus:border-[#E8572A] transition-colors"
            />
          </Field>

          <Field
            label="Slug"
            hint={`arcline.so/you/${slug || "your-slug"}`}
            required
          >
            <div className="flex items-center border border-border focus-within:border-[#E8572A] transition-colors bg-surface">
              <span className="px-3 text-text3 font-mono text-sm select-none border-r border-border h-full py-3">
                /
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="your-slug"
                maxLength={50}
                className="flex-1 bg-transparent px-3 py-3 text-text1 font-mono text-sm placeholder:text-text3 outline-none"
              />
            </div>
            <p className="text-[10px] font-mono text-text3 mt-1">
              Lowercase letters, numbers, hyphens only.
            </p>
          </Field>

          <div className="flex justify-end mt-4">
            <Button
              onClick={() => setStep(2)}
              disabled={!title.trim() || !slug.trim()}
              className="flex items-center gap-2"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 2: Tagline + Description + Category ────── */}
      {step === 2 && (
        <div className="flex flex-col gap-6">
          <Field label="Tagline" hint="One punchy sentence — what is this?">
            <input
              autoFocus
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Proof-of-work for builders."
              maxLength={120}
              className="w-full bg-surface border border-border px-4 py-3 text-text1 font-body text-base
                         placeholder:text-text3 outline-none focus:border-[#E8572A] transition-colors"
            />
          </Field>

          <Field label="Description" hint="Optional. Give more context.">
            <textarea
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="What are you building, why, and for whom?"
              rows={5}
              maxLength={600}
              className="w-full bg-surface border border-border px-4 py-3 text-text1 font-body text-sm
                         placeholder:text-text3 outline-none resize-none focus:border-[#E8572A] transition-colors leading-relaxed"
            />
            <p className="text-[10px] font-mono text-text3 mt-1 text-right">{description.length}/600</p>
          </Field>

          <Field label="Category">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value === category ? "" : cat.value)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-mono border transition-all",
                    category === cat.value
                      ? "border-[#E8572A] text-[#E8572A] bg-[#E8572A10]"
                      : "border-border2 text-text3 hover:border-text3 hover:text-text2"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </Field>

          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 text-text3 text-sm hover:text-text2 transition-colors font-mono"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <Button onClick={() => setStep(3)} className="flex items-center gap-2">
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Stage ───────────────────────────────── */}
      {step === 3 && (
        <div className="flex flex-col gap-6">
          <div className="grid gap-3">
            {STAGES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStage(s.id)}
                className={cn(
                  "w-full text-left border p-4 flex items-center gap-4 group transition-all",
                  stage === s.id
                    ? "border-[#E8572A] bg-surface2"
                    : "border-border bg-surface hover:border-[#E8572A]/40"
                )}
              >
                <div
                  className="w-9 h-9 flex items-center justify-center flex-shrink-0 border"
                  style={{
                    borderColor: stage === s.id ? s.color : "#333",
                    backgroundColor: stage === s.id ? `${s.color}15` : "transparent",
                  }}
                >
                  <s.icon
                    className="w-4 h-4 transition-colors"
                    style={{ color: stage === s.id ? s.color : "#666" }}
                  />
                </div>
                <div>
                  <div className="font-mono text-sm font-medium text-text1">{s.label}</div>
                  <div className="font-body text-xs text-text3 mt-0.5">{s.desc}</div>
                </div>
                {stage === s.id && (
                  <CheckCircle2 className="w-4 h-4 ml-auto text-[#E8572A]" />
                )}
              </button>
            ))}
          </div>

          {error && (
            <p className="text-[#FF5252] font-mono text-xs border border-[#FF5252]/30 bg-[#FF525210] px-4 py-3">
              ⚠ {error}
            </p>
          )}

          <div className="flex items-center justify-between mt-2">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-1.5 text-text3 text-sm hover:text-text2 transition-colors font-mono"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2"
            >
              {submitting ? "Creating…" : "Create project"}
              {!submitting && <Rocket className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}
    </PageTransition>
  );
}

// ── Utility field wrapper ─────────────────────────────────
function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-mono uppercase tracking-widest text-text3 flex items-center gap-1">
        {label}
        {required && <span className="text-[#E8572A]">*</span>}
        {hint && <span className="normal-case tracking-normal text-[#555] ml-1">— {hint}</span>}
      </label>
      {children}
    </div>
  );
}
