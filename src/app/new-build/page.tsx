"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import PageTransition from "@/components/shared/PageTransition";
import Button from "@/components/shared/Button";
import { cn } from "@/lib/utils";
import { Rocket, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";

// ── Constants ──────────────────────────────────────────────
const CATEGORIES: { label: string; value: string }[] = [
  { label: "Startup",        value: "STARTUP"        },
  { label: "College Project", value: "COLLEGE_PROJECT" },
  { label: "Personal Build",  value: "PERSONAL_BUILD"  },
  { label: "Open Source",     value: "OPEN_SOURCE"     },
];

const ENTRY_TYPES = [
  { id: "REALIZATION", label: "Realization", color: "var(--realization)", textClass: "text-realization border-realization" },
  { id: "WIN",         label: "Win",         color: "var(--win)",         textClass: "text-win border-win"                 },
  { id: "SETBACK",     label: "Setback",     color: "var(--setback)",     textClass: "text-setback border-setback"         },
  { id: "MILESTONE",   label: "Milestone",   color: "var(--milestone)",   textClass: "text-milestone border-milestone"     },
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
  const { profile } = useAuth();

  const [step, setStep]             = useState<1 | 2 | 3>(1);
  const [title, setTitle]           = useState("");
  const [slug, setSlug]             = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [tagline, setTagline]       = useState("");
  const [description, setDesc]      = useState("");
  const [category, setCategory]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");
  const [done, setDone]             = useState(false);

  // Step 3 — first entry state
  const [entryType, setEntryType]   = useState("REALIZATION");
  const [entryTitle, setEntryTitle] = useState("");
  const [entryBody, setEntryBody]   = useState("");

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: Record<string, any> = {
      title,
      slug,
      stage: "STARTED", // always default — no longer user-selected
    };
    if (tagline.trim())     payload.tagline     = tagline.trim();
    if (description.trim()) payload.description = description.trim();
    if (category)           payload.category    = category;

    // 1. Create project
    const projectRes = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const projectJson = await projectRes.json();
    if (!projectRes.ok) {
      setError(projectJson.error || "Failed to create project.");
      setSubmitting(false);
      return;
    }

    const projectId   = projectJson.data.id;
    const projectSlug = projectJson.data.slug;

    // 2. Log first entry (if title + body are filled)
    if (entryTitle.trim() && entryBody.trim()) {
      const entryRes = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          type: entryType,
          title: entryTitle.trim(),
          entry_body: entryBody.trim(),
        }),
      });
      if (!entryRes.ok) {
        // Project was created — don't block, just note it
        const entryJson = await entryRes.json();
        console.warn("First entry failed:", entryJson.error);
      }
    }

    setDone(true);
    // Redirect to the project's build log
    const username = profile?.username || "";
    setTimeout(() => router.push(username ? `/${username}/${projectSlug}` : "/dashboard"), 1200);
  }

  // ── Success screen ──────────────────────────────────────
  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-48px)] gap-6">
        <CheckCircle2 className="w-12 h-12 text-[#E8572A]" />
        <h2 className="text-2xl font-display font-bold">Project created.</h2>
        <p className="text-text2 text-sm">Taking you to your build log…</p>
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
          {step === 3 && "Kick it off with an entry"}
        </h1>
        <p className="text-text3 text-sm mt-2">
          {step === 1 && "Every build needs a name and a handle."}
          {step === 2 && "A one-liner and optional context go a long way."}
          {step === 3 && "What's happening right now? This becomes your Day 1."}
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

          <Field label="Slug" hint={`arcline.so/you/${slug || "your-slug"}`} required>
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

      {/* ── Step 3: First Entry ──────────────────────────── */}
      {step === 3 && (
        <div className="flex flex-col gap-6">

          {/* Entry type selector */}
          <div>
            <label className="text-xs font-mono uppercase tracking-widest text-text3 mb-3 block">
              Entry type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {ENTRY_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setEntryType(type.id)}
                  className={cn(
                    "py-3 px-4 border text-xs font-mono tracking-widest transition-all",
                    entryType === type.id
                      ? cn(type.textClass, "bg-surface2")
                      : "border-border2 text-text2 hover:border-text3 hover:bg-surface"
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Entry title */}
          <Field label="Entry title" required>
            <input
              autoFocus
              type="text"
              value={entryTitle}
              onChange={(e) => setEntryTitle(e.target.value)}
              placeholder="What's the situation right now?"
              maxLength={140}
              className="w-full bg-surface border border-border px-4 py-3 text-text1 font-body text-base
                         placeholder:text-text3 outline-none focus:border-[#E8572A] transition-colors"
            />
          </Field>

          {/* Entry body */}
          <Field label="Entry body" required>
            <textarea
              value={entryBody}
              onChange={(e) => setEntryBody(e.target.value)}
              placeholder="Describe where you are and what you're building. Don't hold back."
              rows={6}
              maxLength={2000}
              className="w-full bg-surface border border-border px-4 py-3 text-text1 font-body text-sm
                         placeholder:text-text3 outline-none resize-none focus:border-[#E8572A] transition-colors leading-relaxed"
            />
            <p className="text-[10px] font-mono text-text3 mt-1 text-right">{entryBody.length}/2000</p>
          </Field>

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
              disabled={submitting || !entryTitle.trim() || !entryBody.trim()}
              className="flex items-center gap-2"
            >
              {submitting ? "Creating…" : "Create Project + Log Entry"}
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
