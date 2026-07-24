"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageTransition from "@/components/shared/PageTransition";
import Button from "@/components/shared/Button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { Plus, FolderOpen, ArrowRight, Layers } from "lucide-react";
import ArcloneMonogram from "@/components/shared/ArcloneMonogram";

const ENTRY_TYPES = [
  { id: "WIN",         label: "WIN",         borderVar: "--win",         textClass: "text-win border-win"         },
  { id: "SETBACK",     label: "SETBACK",     borderVar: "--setback",     textClass: "text-setback border-setback" },
  { id: "MILESTONE",   label: "MILESTONE",   borderVar: "--milestone",   textClass: "text-milestone border-milestone" },
  { id: "REALIZATION", label: "REALIZATION", borderVar: "--realization", textClass: "text-realization border-realization" },
];

const PLACEHOLDER: Record<string, string> = {
  WIN:         "What did you achieve? Don't downplay it.",
  SETBACK:     "What went wrong? Be brutally honest.",
  MILESTONE:   "What checkpoint did you hit?",
  REALIZATION: "What clicked? Describe the shift in thinking.",
};

export default function NewEntryPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const titleRef = useRef<HTMLInputElement>(null);

  const [selectedType, setSelectedType] = useState("REALIZATION");
  const [mood, setMood]                 = useState(3);
  const [title, setTitle]               = useState("");
  const [content, setContent]           = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [myProjects, setMyProjects]     = useState<any[]>([]);
  const [projectId, setProjectId]       = useState("");
  const [isDraft, setIsDraft]           = useState(false);
  const [charCount, setCharCount]       = useState(0);
  const [submitted, setSubmitted]       = useState(false);
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [pickingProject, setPickingProject] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const activeType = ENTRY_TYPES.find(t => t.id === selectedType)!;
  const isValid    = title.trim().length > 0 && content.trim().length > 0;

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('projects')
      .select('id, title')
      .eq('user_id', profile.id)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setMyProjects(data);
          setProjectId(data[0].id);
        }
        setProjectsLoaded(true);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  function handleContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value);
    setCharCount(e.target.value.length);
  }

  async function handleSubmit(draft = false) {
    if ((!isValid && !draft) || !projectId) return;
    setIsSubmitting(true);
    setErrorMsg("");
    setIsDraft(draft);
    
    if (draft) {
      try {
        const draftEntry = {
          id: `draft_${Date.now()}`,
          projectId,
          type: selectedType,
          title,
          content,
          mood,
          date: new Date().toISOString()
        };
        const draftsStr = localStorage.getItem("arcline_drafts") || "[]";
        const drafts = JSON.parse(draftsStr);
        drafts.push(draftEntry);
        localStorage.setItem("arcline_drafts", JSON.stringify(drafts));
        
        setSubmitted(true);
        setTimeout(() => router.push(`/${profile?.username}?tab=archives`), 1200);
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    try {
      // POST to /api/journal
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          type: selectedType,
          title,
          entry_body: content,
          mood,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to publish entry");

      setSubmitted(true);
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch (err: any) {
      setErrorMsg(err.message);
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-48px)] gap-6">
        <div className="opacity-60 mb-2">
          <ArcloneMonogram size={56} />
        </div>
        <h2 className="text-2xl font-display font-bold">
          {isDraft ? "Draft saved." : "Entry published."}
        </h2>
        <p className="text-text2 text-sm">Redirecting to dashboard…</p>
      </div>
    );
  }

  // ── Gate 1: No projects exist ─────────────────────────
  if (projectsLoaded && myProjects.length === 0) {
    return (
      <PageTransition className="flex flex-col items-center justify-center min-h-[calc(100vh-48px)] p-8">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-surface border border-border flex items-center justify-center">
            <Layers className="w-7 h-7 text-text3" />
          </div>
          <h1 className="text-2xl font-display font-bold mb-3">No project yet</h1>
          <p className="text-text2 text-sm mb-8 leading-relaxed">
            Entries live inside a project — your build, idea, or journey.
            <br />
            Create one first, then start logging.
          </p>
          <Link
            href="/new-build"
            className="inline-flex items-center gap-3 bg-[#E8572A] text-white font-body font-medium text-sm px-6 py-3 hover:bg-[#D14820] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create your first project
          </Link>
          <div className="mt-4">
            <button
              onClick={() => router.back()}
              className="text-text3 font-mono text-xs hover:text-text2 transition-colors"
            >
              ← Go back
            </button>
          </div>
        </div>
      </PageTransition>
    );
  }

  // ── Gate 2: Pick which project to log against ─────────
  if (projectsLoaded && myProjects.length > 0 && pickingProject) {
    return (
      <PageTransition className="p-4 md:p-8 max-w-3xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">Log New Entry</h1>
          <p className="text-text3 font-mono text-xs uppercase tracking-widest">
            Select a project to log against
          </p>
        </div>

        <div className="grid gap-3">
          {myProjects.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setProjectId(p.id);
                setPickingProject(false);
              }}
              className={cn(
                "w-full text-left border transition-all p-5 group",
                projectId === p.id
                  ? "border-[#E8572A] bg-[#E8572A08]"
                  : "border-border hover:border-[#E8572A]/50 bg-surface hover:bg-surface2"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FolderOpen className="w-4 h-4 text-text3 group-hover:text-[#E8572A] transition-colors" />
                  <span className="font-body font-medium text-text1">{p.title}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-text3 opacity-0 group-hover:opacity-100 group-hover:text-[#E8572A] transition-all" />
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-text3 font-mono text-xs hover:text-text2 transition-colors"
          >
            ← Cancel
          </button>
          <Link
            href="/new-build"
            className="text-text3 font-mono text-xs hover:text-[#E8572A] transition-colors ml-auto"
          >
            + New project instead
          </Link>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="p-4 md:p-8 max-w-3xl mx-auto w-full pb-36">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold">Log New Entry</h1>
        <button
          onClick={() => setPickingProject(true)}
          className="flex items-center gap-2 text-xs font-mono text-text3 uppercase tracking-widest hover:text-[#E8572A] transition-colors group"
          title="Change project"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>{myProjects.find(p => p.id === projectId)?.title ?? "No Project Selected"}</span>
          <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">(change)</span>
        </button>
      </div>

      {/* ── Type Selector ───────────────────────────────── */}
      <div className="mb-8">
        <label className="block text-xs font-mono uppercase tracking-widest text-text3 mb-3">
          Entry Type
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {ENTRY_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => {
                setSelectedType(type.id);
                titleRef.current?.focus();
              }}
              className={cn(
                "py-3 px-4 border text-xs font-mono tracking-widest transition-all rounded-none",
                selectedType === type.id
                  ? cn(type.textClass, "bg-surface2")
                  : "border-border2 text-text2 hover:border-text3 hover:bg-surface"
              )}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Editor Card ─────────────────────────────────── */}
      <div
        className="bg-surface border border-border rounded-none border-l-[3px] transition-all duration-300"
        style={{ borderLeftColor: `var(${activeType.borderVar})` }}
      >
        {/* Type badge inside card */}
        <div className="px-6 pt-5 pb-0">
          <span className={cn(
            "text-[10px] font-mono tracking-widest border px-2 py-0.5",
            activeType.textClass
          )}>
            {activeType.label}
          </span>
        </div>

        <div className="p-6">
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give this entry a title…"
            className="w-full bg-transparent text-2xl font-display font-bold text-text1
                       placeholder:text-text3 border-none outline-none mb-4 caret-accent"
          />
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder={PLACEHOLDER[selectedType]}
            rows={10}
            className="w-full bg-transparent text-text1 placeholder:text-text3 border-none
                       outline-none resize-none text-sm leading-relaxed caret-accent"
          />
        </div>

        {/* Char count bar */}
        <div className="px-6 pb-4 flex items-center justify-between border-t border-border pt-4">
          <span className="text-[10px] font-mono text-text3">{charCount} chars</span>
          {!isValid && title.trim().length === 0 && content.trim().length === 0 && (
            <span className="text-[10px] font-mono text-text3">
              Fill in a title and body to publish
            </span>
          )}
        </div>
      </div>

      {/* ── Mood Indicator ──────────────────────────────── */}
      <div className="mt-8">
        <label className="block text-xs font-mono uppercase tracking-widest text-text3 mb-3">
          Current Momentum
        </label>
        <div className="flex items-center gap-4">
          <span className="text-xs text-text3">Low</span>
          <div className="flex gap-3">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                onClick={() => setMood(level)}
                title={`Momentum ${level}`}
                className={cn(
                  "w-5 h-5 rounded-[50%] border-2 transition-all duration-200",
                  mood >= level
                    ? `border-[color:var(${activeType.borderVar})] bg-[color:var(${activeType.borderVar})] scale-110`
                    : "border-border2 bg-surface"
                )}
              />
            ))}
          </div>
          <span className="text-xs text-text3">High</span>
          <span className="ml-2 text-xs font-mono text-text2">{mood}/5</span>
        </div>
      </div>

      {/* ── Sticky Bottom Bar ────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 md:left-[240px] bg-[rgba(8,8,8,0.95)]
                      backdrop-blur-[12px] border-t border-border p-4 flex items-center justify-between z-40">
        <div className="flex flex-col gap-1">
          <Button variant="ghost" onClick={() => handleSubmit(true)} disabled={isSubmitting}>
            {isSubmitting && isDraft ? "Saving..." : "Save Draft"}
          </Button>
          {errorMsg && <span className="text-red-500 text-xs px-4">{errorMsg}</span>}
        </div>
        <div className="flex items-center gap-3">
          {myProjects.length > 0 ? (
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="bg-surface border border-border2 text-sm text-text1 px-3 py-2 outline-none
                         hover:border-text3 transition-colors cursor-pointer"
              disabled={isSubmitting}
            >
              {myProjects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          ) : (
            <div className="text-sm text-text3 font-mono border border-border2 px-3 py-2">
              Create a project first
            </div>
          )}
          <Button
            onClick={() => handleSubmit(false)}
            disabled={!isValid || isSubmitting}
            className={cn("transition-opacity", (!isValid || isSubmitting) && "opacity-40 cursor-not-allowed")}
          >
            {isSubmitting && !isDraft ? "Publishing..." : "Publish Entry"}
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}
