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

const TABS = ["Build Logs", "Journey Map", "About"];

// ─── Journey Map ──────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function JourneyMapTab({ entries }: { entries: any[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const typeColors: Record<string, string> = {
    WIN:         "var(--win)",
    SETBACK:     "var(--setback)",
    MILESTONE:   "var(--milestone)",
    REALIZATION: "var(--realization)",
  };

  const typeLabelColors: Record<string, string> = {
    WIN:         "text-win border-win/30 bg-win/5",
    SETBACK:     "text-setback border-setback/30 bg-setback/5",
    MILESTONE:   "text-milestone border-milestone/30 bg-milestone/5",
    REALIZATION: "text-realization border-realization/30 bg-realization/5",
  };

  // Sort entries chronologically for the map
  const sortedEntries = [...entries].reverse();

  // Define a nice curved path by mapping coordinates to the container size
  // Let the container be 1000px wide, 380px high
  const widthVal = 1000;
  const heightVal = 530;

  const momentumMap: Record<string, number> = {
    WIN: 230,       // Top-ish
    MILESTONE: 300, // Upper middle
    REALIZATION: 380, // Lower middle
    SETBACK: 460    // Bottom
  };

  const points = sortedEntries.map((entry, i) => {
    const segmentWidth = sortedEntries.length === 1 ? widthVal / 2 : widthVal / (sortedEntries.length + 0.2);
    return {
      x: sortedEntries.length === 1 ? widthVal / 2 : (i + 0.6) * segmentWidth,
      y: momentumMap[entry.type] ?? (heightVal / 2),
      type: entry.type,
      title: entry.title,
      content: entry.content || entry.body,
      date: entry.date || new Date(entry.created_at).toLocaleDateString(),
      raw: entry
    };
  });

  const createCurvedPath = (pts: typeof points) => {
    if (pts.length === 0) return "";
    if (pts.length === 1) return `M${pts[0].x},${pts[0].y}`;
    
    let path = `M${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const current = pts[i];
      const next = pts[i + 1];
      const cp1x = current.x + (next.x - current.x) * 0.5;
      const cp1y = current.y;
      const cp2x = current.x + (next.x - current.x) * 0.5;
      const cp2y = next.y;
      
      path += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${next.x},${next.y}`;
    }
    return path;
  };

  const pathD = createCurvedPath(points);

  // Statistics calculation for the Dashboard at the bottom
  const total = sortedEntries.length;
  const wins = sortedEntries.filter(e => e.type === "WIN").length;
  const setbacks = sortedEntries.filter(e => e.type === "SETBACK").length;
  const milestones = sortedEntries.filter(e => e.type === "MILESTONE").length;
  const realizations = sortedEntries.filter(e => e.type === "REALIZATION").length;

  // Progress Metric: Ratio of productive milestones/wins vs setbacks
  const progressPercent = total > 0 ? Math.round(((wins + milestones + realizations) / total) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* ── Visual Map Container ────────────────────────────────── */}
      <div className="bg-surface border border-border p-6 md:p-8 relative overflow-x-auto select-none">
        <div className="w-[1100px] h-[720px] relative">
          
          {/* Grid lines background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

          {/* SVG Journey Track */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Mountain at the final node (Victory Landmark) */}
            {points.length > 0 && (
              <g transform={`translate(${points[points.length - 1].x - 60}, ${points[points.length - 1].y - 80})`} className="opacity-20">
                <path d="M 60 0 L 120 120 L 0 120 Z" fill="none" stroke="var(--border-2)" strokeWidth="1" />
                <path d="M 60 0 L 80 40 L 40 40 Z" fill="none" stroke="var(--border-2)" strokeWidth="0.5" />
                <line x1="60" y1="0" x2="60" y2="-20" stroke="var(--border-2)" strokeWidth="1" />
                <polygon points="60,-20 80,-12 60,-5" fill="var(--border-2)" />
              </g>
            )}

            {/* Road/Base Track (Large Path) */}
            {pathD && (
              <>
                <path d={pathD} fill="none" stroke="var(--surface2)"
                  strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" className="opacity-30" />
                <path d={pathD} fill="none" stroke="var(--border-2)"
                  strokeWidth="1.5" strokeDasharray="5,8" strokeLinecap="round" />
              </>
            )}

            {/* Glowing active animation line */}
            {pathD && (
              <motion.path
                d={pathD} fill="none" stroke="var(--accent)" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2.2, ease: "easeInOut" }}
              />
            )}

            {/* Connector Lines & Active Node Pulsing */}
            {points.map((p, i) => {
              const isHovered = hoveredIndex === i;
              const isEven = i % 2 === 0;
              const lineOffset = isEven ? -40 : 40;

              return (
                <g key={i}>
                  {/* Glowing vertical connector to float cards */}
                  <line 
                    x1={p.x} 
                    y1={p.y} 
                    x2={p.x} 
                    y2={p.y + lineOffset} 
                    stroke={isHovered ? "var(--accent)" : "var(--border-2)"} 
                    strokeWidth={isHovered ? "1.2" : "0.6"} 
                    strokeDasharray="2,3"
                    className="transition-colors duration-200"
                  />

                  {/* Pulsing ring around node on hover */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.circle
                        cx={p.x}
                        cy={p.y}
                        r="12"
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="1"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1.3, opacity: [0, 0.4, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Nodes along curve */}
                  <circle cx={p.x} cy={p.y} r="5" fill="var(--bg)" stroke={typeColors[p.type]} strokeWidth="2.5" />
                  <circle cx={p.x} cy={p.y} r="2" fill={typeColors[p.type]} />
                </g>
              );
            })}
          </svg>

          {/* HTML Cards Layer */}
          <div className="absolute inset-0 pointer-events-none">
            {points.map((p, i) => {
              const isHovered = hoveredIndex === i;
              const isEven = i % 2 === 0;

              // Alternating layout: even steps float above the track, odd steps float below
              const cardY = isEven ? p.y - 220 : p.y + 40;

              return (
                <motion.div
                  key={i}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={cn(
                    "absolute pointer-events-auto w-[240px] h-[180px] bg-bg/95 border transition-all duration-300",
                    isHovered 
                      ? "border-accent shadow-[0_8px_30px_rgba(232,87,42,0.15)] -translate-y-1" 
                      : "border-border shadow-md"
                  )}
                  style={{
                    left: p.x - 120, // Center horizontally on node
                    top: cardY,
                  }}
                  initial={{ opacity: 0, scale: 0.95, y: isEven ? -10 : 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.15 * i, duration: 0.4, ease: "easeOut" }}
                >
                  {/* Card Header color accent based on type */}
                  <div 
                    className="h-1 w-full" 
                    style={{ backgroundColor: typeColors[p.type] }}
                  />

                  <div className="p-4 flex flex-col h-full justify-between gap-2">
                    {/* Index & Type Label */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-text3 uppercase tracking-wider">
                        Step {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className={cn(
                        "text-[9px] font-mono px-2 py-0.5 border uppercase tracking-wider",
                        typeLabelColors[p.type]
                      )}>
                        {p.type}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-display font-bold text-text1 line-clamp-1 leading-tight mt-1">
                      {p.title}
                    </h3>

                    {/* Content Snippet */}
                    <p className="text-[11px] text-text2 line-clamp-2 leading-relaxed font-body font-light">
                      {p.content}
                    </p>

                    {/* Footer Date */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-border/50 mt-1">
                      <Calendar className="w-3 h-3 text-text3" />
                      <span className="text-[10px] font-mono text-text3">{p.date}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>
      </div>

      {/* ── Legend & Summary Dashboard ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1.4fr_0.6fr] gap-6 bg-surface border border-border p-6 md:p-8">
        
        {/* Metric 1: Circular Progress Ring */}
        <div className="flex flex-col sm:flex-row items-center gap-6 border-b lg:border-b-0 lg:border-r border-border pb-6 sm:pb-0 sm:pr-6">
          <div className="relative w-28 h-28 flex-shrink-0">
            {/* SVG circle progress */}
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="56" cy="56" r="48" fill="none" stroke="var(--border)" strokeWidth="6" />
              <motion.circle 
                cx="56" 
                cy="56" 
                r="48" 
                fill="none" 
                stroke="var(--accent)" 
                strokeWidth="6" 
                strokeDasharray={2 * Math.PI * 48}
                initial={{ strokeDashoffset: 2 * Math.PI * 48 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 48 * (1 - progressPercent / 100) }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-mono font-bold text-text1">{progressPercent}%</span>
              <span className="text-[9px] font-mono text-text3 uppercase tracking-wider">Momentum</span>
            </div>
          </div>
          <div className="text-center sm:text-left">
            <h3 className="text-sm font-display font-bold text-text1">Overall Progress</h3>
            <p className="text-xs text-text3 mt-1 leading-relaxed">
              Based on emotional momentum ratios. Setbacks are normalized as progression markers.
            </p>
          </div>
        </div>

        {/* Metric 2: Grid Statistics */}
        <div className="flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-border pb-6 lg:pb-0 lg:pr-6">
          <div>
            <span className="text-[9px] font-mono uppercase tracking-widest text-text3">Journey Stats</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
              {[
                { label: "Wins", value: wins, color: "var(--win)" },
                { label: "Setbacks", value: setbacks, color: "var(--setback)" },
                { label: "Milestones", value: milestones, color: "var(--milestone)" },
                { label: "Realizations", value: realizations, color: "var(--realization)" },
              ].map(stat => (
                <div key={stat.label} className="bg-bg border border-border p-2">
                  <div className="text-lg font-mono" style={{ color: stat.color }}>
                    {stat.value}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-text3 font-mono mt-0.5">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-4 text-[11px] text-text2 font-mono">
            <span className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-accent animate-pulse" />
              Streak: 6 Days
            </span>
            <span className="text-border2">|</span>
            <span className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-accent" />
              Badges: 3
            </span>
          </div>
        </div>

        {/* Metric 3: Next Step Call-To-Action */}
        <div className="flex flex-col justify-between h-full min-h-[120px]">
          <div>
            <span className="text-[9px] font-mono uppercase tracking-widest text-text3">Next Step</span>
            <h4 className="text-xs font-display font-bold text-text1 mt-2 flex items-center gap-1">
              Log a realization or milestone <Sparkles className="w-3.5 h-3.5 text-accent flex-shrink-0" />
            </h4>
            <p className="text-[10px] text-text3 mt-1 leading-relaxed">
              Every day spent building requires proof of work. Document the details.
            </p>
          </div>
          <Link href="/new-entry" className="mt-3 block">
            <button className="w-full py-2 border border-accent/40 bg-accentDim hover:bg-accent hover:text-white transition-all text-xs font-mono font-bold tracking-widest uppercase flex items-center justify-center gap-1">
              Log Entry <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>
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
    projectId: dbEntry.project.title,
    builder: {
      username: dbEntry.author.username,
      name: dbEntry.author.name,
      initials: dbEntry.author.name.substring(0, 2).toUpperCase(),
      avatarUrl: dbEntry.author.avatar_url,
      avatarBg: "bg-surface2",
    },
    type: dbEntry.type,
    title: dbEntry.title,
    content: dbEntry.body,
    date: new Date(dbEntry.created_at).toLocaleDateString(),
    reactions: { feel: 0, keepGoing: 0, hitMe: 0, beenHere: 0 },
    reaction_count: dbEntry.reaction_count,
  };
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
    tabParam === "map" ? "Journey Map" : tabParam === "about" ? "About" : "Build Logs";
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

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      try {
        const [profileRes, entriesRes] = await Promise.all([
          fetch(`/api/profile/${params.username}`),
          fetch(`/api/entries?username=${params.username}`)
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

  const isOwner = user?.id === builder?.id;

  function handleTabChange(tab: string) {
    setActiveTab(tab);
    const paramMap: Record<string, string> = {
      "Journey Map": "map",
      "About":       "about",
      "Build Logs":  "logs",
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
            <p className="text-text2 mb-4 max-w-lg text-sm leading-relaxed">{builder.bio}</p>

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
              { label: "Journey Map",  count: entries.length,                           key: "Journey Map"  },
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

        {activeTab === "Journey Map" && <JourneyMapTab entries={entries} />}

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
