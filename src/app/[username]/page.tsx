"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  Flag, 
  TrendingUp, 
  Zap, 
  AlertTriangle, 
  BookOpen, 
  Flame, 
  Calendar, 
  Award, 
  Activity, 
  ArrowUpRight,
  Sparkles,
  Mountain,
  ChevronRight
} from "lucide-react";
import PageTransition from "@/components/shared/PageTransition";
import ProjectCard from "@/components/shared/ProjectCard";
import Avatar from "@/components/shared/Avatar";
import Button from "@/components/shared/Button";
import EntryCard from "@/components/shared/EntryCard";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import MessageDrawer from "@/components/shared/MessageDrawer";
import BuildHeatmap from "@/components/shared/BuildHeatmap";


const TABS = ["Build Logs", "Progress", "About"];

// ─── Journey Momentum Score (JMS) ──────────────────────────────────────────────
// Philosophy: every entry type is a positive contribution.
// NOTHING reduces momentum — only inactivity does.
// Setbacks score higher than wins (courage premium).
//
// Formula:
//   raw_score   = Σ(base_points × recency_multiplier) over all entries
//   momentum    = raw_score × streak_mult × diversity_bonus × project_bonus
//   jms_percent = MIN(100, momentum / 300 × 100)  — floor 5% for registered users

const JMS_BASE: Record<string, number> = {
  MILESTONE:   15,
  SETBACK:     12,
  WIN:         10,
  REALIZATION:  8,
};

const JMS_BENCHMARK = 300;

function getRecencyMultiplier(createdAt: string): number {
  const diffMs   = Date.now() - new Date(createdAt).getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays <  1) return 2.0;
  if (diffDays <  7) return 1.5;
  if (diffDays < 30) return 1.2;
  return 1.0;
}

function calcStreakDays(entries: { created_at: string }[]): number {
  if (entries.length === 0) return 0;
  const entryDays = new Set(
    entries.map(e => {
      const d = new Date(e.created_at);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const check = new Date(today);
    check.setDate(today.getDate() - i);
    const key = `${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`;
    if (entryDays.has(key)) streak++;
    else break;
  }
  return streak;
}

interface JMSResult {
  percent:          number;
  score:            number;  // rounded percent (legacy compat)
  momentumPoints:   number;
  rawScore:         number;
  streakDays:       number;
  streakMultiplier: number;
  diversityBonus:   number;
  projectBonus:     number;
  uniqueProjects:   number;
  wins:             number;
  setbacks:         number;
  milestones:       number;
  realizations:     number;
  state:            string;
  stateColour:      string;
}

function calcMomentum(
  entries: { type?: string; created_at: string; projectId?: string }[]
): JMSResult {
  const wins        = entries.filter(e => e.type === "WIN").length;
  const setbacks    = entries.filter(e => e.type === "SETBACK").length;
  const milestones  = entries.filter(e => e.type === "MILESTONE").length;
  const realizations = entries.filter(e => e.type === "REALIZATION").length;

  // ── Step 6: raw score ─────────────────────────────────────────
  let rawScore = 0;
  for (const entry of entries) {
    const base    = JMS_BASE[entry.type ?? ""] ?? 8;
    const recency = getRecencyMultiplier(entry.created_at);
    rawScore += base * recency;
  }

  // ── Step 3: streak multiplier ─────────────────────────────────
  const streakDays       = calcStreakDays(entries);
  const streakMultiplier = Math.min(2.0, 1.0 + streakDays * 0.02);

  // ── Step 4: diversity bonus ───────────────────────────────────
  const typesPosted   = [wins > 0, setbacks > 0, milestones > 0, realizations > 0].filter(Boolean).length;
  const diversityBonus = typesPosted === 4 ? 1.25
                       : typesPosted === 3 ? 1.10
                       : typesPosted === 2 ? 1.05
                       : 1.00;

  // ── Step 5: multi-project bonus ───────────────────────────────
  const uniqueProjects = new Set(
    entries.map(e => e.projectId).filter(Boolean)
  ).size || 1;
  const projectBonus = Math.min(1.25, 1.0 + (uniqueProjects - 1) * 0.05);

  // ── Steps 7-8: final score ────────────────────────────────────
  const momentumPoints = rawScore * streakMultiplier * diversityBonus * projectBonus;
  let percent = Math.min(100, (momentumPoints / JMS_BENCHMARK) * 100);
  // Floor: 5% for any registered user
  percent = Math.max(5, percent);
  percent = Math.round(percent * 10) / 10;

  // ── Step 9: state label ───────────────────────────────────────
  let state: string;
  let stateColour: string;
  if      (percent <= 15) { state = "Just Started"; stateColour = "#555555"; }
  else if (percent <= 30) { state = "Warming Up";   stateColour = "#FF9800"; }
  else if (percent <= 50) { state = "Building";     stateColour = "#7EB8F5"; }
  else if (percent <= 70) { state = "Momentum";     stateColour = "#C9A96E"; }
  else if (percent <= 90) { state = "On Fire";      stateColour = "#E8572A"; }
  else                    { state = "Peak Builder"; stateColour = "#4CAF50"; }

  return {
    percent,
    score:            Math.round(percent),
    momentumPoints:   Math.round(momentumPoints * 10) / 10,
    rawScore:         Math.round(rawScore * 10) / 10,
    streakDays,
    streakMultiplier: Math.round(streakMultiplier * 100) / 100,
    diversityBonus,
    projectBonus:     Math.round(projectBonus * 100) / 100,
    uniqueProjects,
    wins, setbacks, milestones, realizations,
    state, stateColour,
  };
}

// ─── Build Pulse Dashboard ──────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BuildPulseTab({ builder, entries }: { builder: any, entries: any[] }) {
  const momentum    = calcMomentum(entries);
  const accentColor = momentum.stateColour;

  // JMS stat cards — all entry types are positive contributors
  const STATS = [
    {
      label:   "Milestones",
      count:   momentum.milestones,
      pts:     momentum.milestones * 15,
      dotColor: "#7EB8F5",
      weight:  "+15 pts each",
    },
    {
      label:   "Wins",
      count:   momentum.wins,
      pts:     momentum.wins * 10,
      dotColor: "#4CAF50",
      weight:  "+10 pts each",
    },
    {
      label:   "Setbacks",
      count:   momentum.setbacks,
      pts:     momentum.setbacks * 12,
      dotColor: "#FF9800",
      weight:  "+12 pts each",
    },
    {
      label:   "Realizations",
      count:   momentum.realizations,
      pts:     momentum.realizations * 8,
      dotColor: "#C9A96E",
      weight:  "+8 pts each",
    },
  ];

  return (
    <div className="flex flex-col gap-5">

      {/* ── 1. MOMENTUM HERO CARD ── */}
      <div className="bg-surface border border-border p-6">
        <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
          <div>
            <h2 className="text-xs font-mono uppercase tracking-widest text-text3 mb-1">
              Builder Momentum
            </h2>
            <p className="text-text2 text-xs leading-relaxed max-w-sm">
              Based on entry types, recency, streak &amp; project diversity.
              Setbacks score higher than wins — documenting struggle takes courage.
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="font-mono text-5xl font-bold leading-none" style={{ color: accentColor }}>
              {momentum.score}
            </div>
            <div className="text-[10px] font-mono text-text3 mt-1 uppercase tracking-widest">/ 100</div>
            <div className="text-xs mt-1 font-mono" style={{ color: accentColor }}>{momentum.state}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative h-2 bg-bg border border-border2 overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 transition-all duration-700 ease-out"
            style={{ width: `${momentum.percent}%`, background: accentColor }}
          />
        </div>

        {/* JMS breakdown sub-row */}
        <div className="flex gap-6 mt-4 flex-wrap">
          <div>
            <span className="text-[10px] font-mono text-text3 uppercase tracking-widest">Momentum</span>
            <span className="ml-2 text-xs font-mono text-text1">{momentum.momentumPoints}<span className="text-text3"> pts</span></span>
          </div>
          <div>
            <span className="text-[10px] font-mono text-text3 uppercase tracking-widest">Streak</span>
            <span className="ml-2 text-xs font-mono text-text1">{momentum.streakDays}<span className="text-text3">d</span></span>
          </div>
          <div>
            <span className="text-[10px] font-mono text-text3 uppercase tracking-widest">Diversity</span>
            <span className="ml-2 text-xs font-mono text-text1">{momentum.diversityBonus}<span className="text-text3">×</span></span>
          </div>
          <div>
            <span className="text-[10px] font-mono text-text3 uppercase tracking-widest">Entries</span>
            <span className="ml-2 text-xs font-mono text-text1">{entries.length}</span>
          </div>
        </div>
      </div>

      {/* ── 2. STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, count, pts, dotColor, weight }) => (
          <div key={label} className="bg-surface border border-border p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: dotColor }} />
                <span className="text-[10px] font-mono uppercase tracking-widest text-text3">{label}</span>
              </div>
              <span className="text-[9px] font-mono text-text3">{weight}</span>
            </div>
            <div className="text-3xl font-mono font-bold" style={{ color: dotColor }}>{count}</div>
            <div className="text-[11px] font-mono text-text3 border-t border-border pt-2">
              +{pts} pts contribution
            </div>
          </div>
        ))}
      </div>

      {/* ── 3. ACTIVITY HEATMAP ── */}
      <div className="bg-surface border border-border p-6">
        <h2 className="text-xs font-mono uppercase tracking-widest text-text3 mb-6">
          Activity — Logged Entries
        </h2>
        <BuildHeatmap
          entries={entries}
          builderSince={builder.building_since}
        />
      </div>

    </div>
  );
}


// ─── About Tab ────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AboutTab({ builder, entries }: { builder: any, entries: any[] }) {
  return (
    <div className="space-y-10 max-w-2xl">
      <div>
        <h2 className="text-lg font-display font-bold mb-3">About</h2>
        <p className="text-text2 leading-relaxed">{builder.bio || "No bio yet."}</p>
      </div>

      <div className="bg-surface2 border border-border2 p-6">
        <h2 className="text-xs font-mono uppercase tracking-widest text-text3 mb-4">Stats</h2>
        <div className="grid grid-cols-3 gap-6">
          {[
            { label: "Followers",  value: builder.followers },
            { label: "Following",  value: builder.following },
            { label: "Total Entries", value: builder.entry_count || entries.length },
          ].map(stat => (
            <div key={stat.label}>
              <div className="text-2xl font-mono text-text1">{stat.value}</div>
              <div className="text-[10px] uppercase tracking-widest text-text3 font-mono mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEntryToCardShape(dbEntry: any) {
  return {
    id: dbEntry.id,
    projectId: dbEntry.project?.title ?? "",
    builder: {
      username: dbEntry.author?.username ?? "",
      name: dbEntry.author?.name ?? "Builder",
      initials: (dbEntry.author?.name ?? "??").substring(0, 2).toUpperCase(),
      avatarUrl: dbEntry.author?.avatar_url,
      avatarBg: "bg-surface2",
    },
    type: dbEntry.type,
    title: dbEntry.title,
    content: dbEntry.body,
    date: new Date(dbEntry.created_at).toLocaleDateString(),
    created_at: dbEntry.created_at,
    reactions: { feel: 0, keepGoing: 0, hitMe: 0, beenHere: 0 },
    reaction_count: dbEntry.reaction_count,
  };
}

// ─── Archives Tab ─────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ArchivesTab({ drafts, setDrafts }: { drafts: any[], setDrafts: any }) {
  const handleDelete = (id: string) => {
    const newDrafts = drafts.filter(d => d.id !== id);
    setDrafts(newDrafts);
    localStorage.setItem("arcline_drafts", JSON.stringify(newDrafts));
  };

  if (drafts.length === 0) {
    return (
      <div className="border border-dashed border-border2 p-16 text-center">
        <p className="text-text3 font-mono text-sm">No drafts yet.</p>
        <Link href="/new-entry" className="inline-block mt-4">
          <Button size="sm">Log a new entry</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {drafts.map((draft, idx) => (
        <div key={draft.id || idx} className="bg-surface p-6 border border-border hover:border-border2 transition-colors">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-mono px-2 py-0.5 border uppercase tracking-wider text-text3 border-border2">
              {draft.type}
            </span>
            <span className="text-[10px] font-mono text-text3">
              {new Date(draft.date).toLocaleDateString()}
            </span>
          </div>
          <h3 className="font-display font-bold text-xl mb-2 text-text1">{draft.title}</h3>
          <p className="text-sm text-text2 line-clamp-3 mb-4 leading-relaxed font-body">{draft.content}</p>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="ghost" onClick={() => handleDelete(draft.id)} className="text-red-500 hover:text-red-400 hover:bg-red-500/10 text-xs">
              Discard
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Mock Profile View (visitor fallback when no DB record) ──────────────────
function MockProfileView({ builder, projects, entries }: { 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  builder: any; projects: any[]; entries: any[] 
}) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Build Logs");

  return (
    <PageTransition className="flex flex-col min-h-[calc(100vh-48px)]">
      {/* Header */}
      <div className="bg-surface border-b border-border p-6 md:p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(232,87,42,0.03)] to-transparent" />
        <div className="max-w-4xl mx-auto relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
          <Avatar initials={builder.initials} src={builder.avatarUrl || builder.avatar_url} bgColor={builder.avatarBg} size="lg" />
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-display font-bold mb-1">{builder.name}</h1>
            <p className="text-text3 font-mono text-xs mb-4">@{builder.username}</p>
            <p className="text-text2 font-body mb-6 max-w-lg text-sm leading-relaxed">{builder.bio}</p>
            <div className="flex items-center justify-center md:justify-start gap-6">
              {[
                { label: "Builds", value: projects.length },
                { label: "Followers", value: builder.followers },
                { label: "Following", value: builder.following },
              ].map((stat, i, arr) => (
                <div key={stat.label} className="flex items-center gap-6">
                  <div className="text-center md:text-left">
                    <div className="text-xl font-mono text-text1">{stat.value}</div>
                    <div className="text-[10px] uppercase tracking-widest text-text3 font-mono mt-0.5">{stat.label}</div>
                  </div>
                  {i < arr.length - 1 && <div className="w-[1px] h-8 bg-border2" />}
                </div>
              ))}
            </div>
          </div>
          <div className="flex-shrink-0">
            {user ? (
              <Button>Follow Builder</Button>
            ) : (
              <Link href="/login?next=/explore">
                <Button>Follow Builder</Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="sticky top-[48px] z-30 bg-[rgba(8,8,8,0.90)] backdrop-blur-[12px] border-b border-border">
        <div className="max-w-5xl mx-auto w-full px-4 md:px-8">
          <div className="flex gap-0">
            {["Build Logs", "About"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-5 py-3 font-mono text-[0.72rem] uppercase tracking-widest transition-colors border-b-2 -mb-[2px]",
                  activeTab === tab
                    ? "border-accent text-text1"
                    : "border-transparent text-text3 hover:text-text2"
                )}
              >{tab}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-8 py-8">
        {activeTab === "Build Logs" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map(p => (
              <Link key={p.id} href={`/${builder.username}/${p.id}`}>
                <ProjectCard project={{ ...p, builder }} />
              </Link>
            ))}
            {projects.length === 0 && (
              <p className="font-body text-text3 text-sm col-span-2">No public builds yet.</p>
            )}
          </div>
        )}
        {activeTab === "About" && (
          <div className="max-w-lg">
            <h2 className="font-display font-bold text-lg mb-3">About</h2>
            <p className="font-body font-light text-text2 text-sm leading-relaxed">{builder.bio}</p>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────
function ProfileContent({ params }: { params: { username: string } }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const tabParam = searchParams.get("tab");
  const initialTab =
    tabParam === "progress" || tabParam === "map" ? "Progress" : tabParam === "about" ? "About" : "Build Logs";
  const [activeTab, setActiveTab] = useState(initialTab);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [builder, setBuilder] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [projects, setProjects] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isMsgOpen, setIsMsgOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [drafts, setDrafts] = useState<any[]>([]);

  const isOwner = user?.id === builder?.id;

  useEffect(() => {
    if (isOwner) {
      const saved = localStorage.getItem("arcline_drafts");
      if (saved) {
        try {
          setDrafts(JSON.parse(saved));
        } catch (e) {}
      }
    }
  }, [isOwner]);

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      try {
        const [profileRes, entriesRes] = await Promise.all([
          fetch(`/api/profile/${params.username}`),
          fetch(`/api/journal?username=${params.username}`)
        ]);
        
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          const builderData = profileData.data.profile;
          setBuilder(builderData);
          setProjects(profileData.data.projects);

          if (user) {
            const checkRes = await fetch(`/api/follows/users/check?following_id=${builderData.id}`);
            if (checkRes.ok) {
              const checkData = await checkRes.json();
              setIsFollowing(checkData.isFollowing);
            }
          }
        }
        
        if (entriesRes.ok) {
          const entriesData = await entriesRes.json();
          setEntries(entriesData.data.map(mapEntryToCardShape));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, [params.username, user]);


  function handleTabChange(tab: string) {
    setActiveTab(tab);
    const paramMap: Record<string, string> = {
      "Progress":    "progress",
      "About":       "about",
      "Build Logs":  "logs",
      "Archives":    "archives",
    };
    router.replace(`/${params.username}?tab=${paramMap[tab]}`, { scroll: false });
  }

  const handleFollow = async () => {
    if (!user) {
      router.push(`/login?next=/${params.username}`);
      return;
    }

    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        const res = await fetch('/api/follows/users', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ following_id: builder.id })
        });
        if (res.ok) {
          setIsFollowing(false);
          setBuilder((prev: any) => ({ ...prev, followers: prev.followers - 1 }));
        }
      } else {
        const res = await fetch('/api/follows/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ following_id: builder.id })
        });
        if (res.ok) {
          setIsFollowing(true);
          setBuilder((prev: any) => ({ ...prev, followers: prev.followers + 1 }));
        } else {
          const errData = await res.json();
          console.error('Follow failed:', res.status, errData);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-16 text-center text-text3 font-mono animate-pulse">Loading profile...</div>;
  }

  if (!builder) {
    return (
      <div className="p-16 text-center">
        <div className="font-mono text-text3 text-xs uppercase tracking-widest mb-4">404</div>
        <h1 className="font-display font-bold text-2xl text-text1 mb-2">Builder not found</h1>
        <p className="font-body text-text2 text-sm">This profile doesn&apos;t exist on Arcline yet.</p>
        <Link href="/explore" className="mt-6 inline-block text-accent font-body text-sm hover:underline">← Explore builders</Link>
      </div>
    );
  }

  return (
    <PageTransition className="flex flex-col min-h-[calc(100vh-48px)]">
      {/* ── Profile Header ───────────────────────────────── */}
      <div className="bg-surface border-b border-border p-6 md:p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(232,87,42,0.03)] to-transparent" />
        <div className="max-w-4xl mx-auto relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
          <Avatar initials={builder.name.substring(0, 2).toUpperCase()} src={builder.avatar_url} bgColor="bg-surface2" size="lg" />

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-display font-bold mb-1">
              {builder.name}
              {builder.pronouns && (
                <span className="ml-3 text-sm font-mono text-text3 font-normal align-middle">{builder.pronouns}</span>
              )}
            </h1>
            <p className="text-text3 font-mono text-xs mb-1">@{builder.username}</p>
            {builder.building_since && (
              <div className="flex items-center gap-3 mb-3">
                <span className="font-mono text-[0.6rem] text-text3">Since {builder.building_since}</span>
              </div>
            )}
            <p className="text-text2 mb-4 max-w-lg text-sm leading-relaxed whitespace-pre-wrap">{builder.bio}</p>

            {(builder.builder_role || builder.currently_building) && (
              <div className="flex flex-col gap-1.5 mb-6 text-left">
                {builder.builder_role && (
                  <span className="inline-flex items-center gap-2 self-start">
                    <span className="font-mono text-[0.6rem] uppercase tracking-widest text-text3">I am</span>
                    <span className="px-2 py-0.5 border border-accent/40 bg-accent/10 text-accent font-mono text-[0.65rem] uppercase tracking-wider">{builder.builder_role}</span>
                  </span>
                )}
                {builder.currently_building && (
                  <span className="inline-flex items-center gap-2 self-start">
                    <span className="font-mono text-[0.6rem] uppercase tracking-widest text-text3">Building</span>
                    <span className="text-text2 text-xs font-body">{builder.currently_building}</span>
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center justify-center md:justify-start gap-6">
              {[
                { label: "Builds",    value: projects.length },
                { label: "Followers", value: builder.followers },
                { label: "Following", value: builder.following },
              ].map((stat, i, arr) => (
                <div key={stat.label} className="flex items-center gap-6">
                  <div className="text-center md:text-left">
                    <div className="text-xl font-mono text-text1">{stat.value}</div>
                    <div className="text-[10px] uppercase tracking-widest text-text3 font-mono mt-0.5">
                      {stat.label}
                    </div>
                  </div>
                  {i < arr.length - 1 && <div className="w-[1px] h-8 bg-border2" />}
                </div>
              ))}
            </div>

            {/* Social Links */}
            {(builder.github_url || builder.twitter_url || builder.website_url || builder.linkedin_url) && (
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                {builder.github_url && (
                  <a href={builder.github_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-text3 hover:text-text1 transition-colors font-mono text-xs">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                    GitHub
                  </a>
                )}
                {builder.twitter_url && (
                  <a href={builder.twitter_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-text3 hover:text-text1 transition-colors font-mono text-xs">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    Twitter/X
                  </a>
                )}
                {builder.website_url && (
                  <a href={builder.website_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-text3 hover:text-text1 transition-colors font-mono text-xs">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                    Website
                  </a>
                )}
                {builder.linkedin_url && (
                  <a href={builder.linkedin_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-text3 hover:text-text1 transition-colors font-mono text-xs">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    LinkedIn
                  </a>
                )}
              </div>
            )}          </div>

          <div className="flex-shrink-0 flex gap-3">
            {isOwner ? (
              <Link href="/settings">
                <Button variant="outline">Edit Profile</Button>
              </Link>
            ) : (
              <>
                <Button 
                  onClick={handleFollow} 
                  disabled={isFollowLoading}
                  variant={isFollowing ? "outline" : "primary"}
                >
                  {isFollowLoading ? "..." : isFollowing ? "Following" : "Follow Builder"}
                </Button>
                <Button variant="ghost" className="border border-border2" onClick={() => {
                  if (!user) { router.push(`/login?next=/${params.username}`); return; }
                  setIsMsgOpen(true);
                }}>Message</Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Message Drawer */}
      {builder && !isOwner && (
        <MessageDrawer
          isOpen={isMsgOpen}
          onClose={() => setIsMsgOpen(false)}
          recipient={{
            id: builder.id,
            name: builder.name,
            username: builder.username,
            avatar_url: builder.avatar_url,
          }}
        />
      )}


      {/* ── Tab Bar ──────────────────────────────────────── */}
      <div className="sticky top-[48px] z-30 bg-[rgba(8,8,8,0.90)] backdrop-blur-[12px] border-b border-border">
        <div className="max-w-5xl mx-auto w-full px-4 md:px-8">
          <div className="flex items-end gap-0 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {[
              { label: "Build Logs",   count: projects.length,                         key: "Build Logs"   },
              { label: "Progress",  count: entries.length,                           key: "Progress"  },
              ...(isOwner ? [{ label: "Archives", count: drafts.length, key: "Archives" }] : []),
              { label: "About",        count: null,                                     key: "About"        },
            ].map((tab) => {
              const isActive = tab.key === activeTab;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={cn(
                    "relative flex items-center gap-2 pt-4 pb-3 px-5 text-sm font-medium",
                    "whitespace-nowrap transition-all duration-200 group",
                    isActive ? "text-text1" : "text-text3 hover:text-text2"
                  )}
                >
                  {/* Label */}
                  <span>{tab.label}</span>

                  {/* Count pill */}
                  {tab.count !== null && tab.count > 0 && (
                    <span className={cn(
                      "text-[10px] font-mono px-1.5 py-0.5 leading-none transition-colors",
                      isActive
                        ? "bg-accentDim text-accent"
                        : "bg-surface2 text-text3 group-hover:text-text2"
                    )}>
                      {tab.count}
                    </span>
                  )}

                  {/* Active sliding underline */}
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent"
                      style={{ borderRadius: 0 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Tab Content ──────────────────────────────────── */}
      <div className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8">
        {activeTab === "Build Logs" && (
          <div className="space-y-8">
            {projects.length === 0 ? (
              <div className="border border-dashed border-border2 p-16 text-center">
                <p className="text-text3 font-mono text-sm">No build logs yet.</p>
                {isOwner && (
                  <Link href="/new-entry" className="inline-block mt-4">
                    <Button size="sm">Start your first build</Button>
                  </Link>
                )}
              </div>
            ) : (
              <>
                {/* Pinned */}
                <div>
                  <h2 className="text-xs font-mono uppercase tracking-widest text-text3 mb-4">
                    Pinned Build
                  </h2>
                  <ProjectCard project={projects[0]} username={builder.username} className="border-accent/20" />
                </div>

                {projects.length > 1 && (
                  <div>
                    <h2 className="text-xs font-mono uppercase tracking-widest text-text3 mb-4">
                      All Builds
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {projects.slice(1).map((project) => (
                        <ProjectCard key={project.id} project={project} username={builder.username} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Entries */}
                {entries.length > 0 && (
                  <div>
                    <h2 className="text-xs font-mono uppercase tracking-widest text-text3 mb-4">
                      Recent Entries
                    </h2>
                    <div className="space-y-4">
                      {entries.slice(0, 3).map(entry => (
                        <EntryCard key={entry.id} entry={entry} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "Progress" && <BuildPulseTab builder={builder} entries={entries} />}

        {activeTab === "Archives" && isOwner && <ArchivesTab drafts={drafts} setDrafts={setDrafts} />}

        {activeTab === "About" && <AboutTab builder={builder} entries={entries} />}
      </div>
    </PageTransition>
  );
}

export default function ProfilePage({ params }: { params: { username: string } }) {
  return (
    <Suspense fallback={<div className="p-8 text-text3 font-mono text-sm">Loading…</div>}>
      <ProfileContent params={params} />
    </Suspense>
  );
}
