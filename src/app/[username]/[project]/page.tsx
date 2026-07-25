"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import PageTransition from "@/components/shared/PageTransition";
import EntryCard from "@/components/shared/EntryCard";
import StageBadge from "@/components/shared/StageBadge";
import Button from "@/components/shared/Button";
import JourneyProgressBar from "@/components/shared/JourneyProgressBar";
import EntryTimeline from "@/components/shared/EntryTimeline";
import CustomSelect from "@/components/shared/CustomSelect";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, LayoutList, Menu, Bookmark } from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────
const FILTER_OPTIONS = [
  { value: "ALL", label: "All types" },
  { value: "WIN", label: "Wins" },
  { value: "SETBACK", label: "Setbacks" },
  { value: "MILESTONE", label: "Milestones" },
  { value: "REALIZATION", label: "Realizations" },
];

// ── Entry mapper ──────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEntryToCardShape(dbEntry: any) {
  return {
    id: dbEntry.id,
    projectId: dbEntry.project?.title ?? "",
    builder: {
      username: dbEntry.author?.username ?? "",
      name:     dbEntry.author?.name     ?? "Builder",
      initials: (dbEntry.author?.name ?? "??").substring(0, 2).toUpperCase(),
      avatarBg: "bg-surface2",
    },
    type:           dbEntry.type,
    title:          dbEntry.title,
    content:        dbEntry.body,
    date:           new Date(dbEntry.created_at).toLocaleDateString(),
    created_at:     dbEntry.created_at,
    reactions:      { feel: 0, keepGoing: 0, hitMe: 0, beenHere: 0 },
    reaction_count: dbEntry.reaction_count,
  };
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BuildLogPage({ params }: { params: { username: string; project: string } }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [project,  setProject]  = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [builder,  setBuilder]  = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [entries,  setEntries]  = useState<any[]>([]);
  const [followers, setFollowers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound,  setNotFound]  = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [activeTab, setActiveTab] = useState<"Build Log" | "Journey Map">("Build Log");
  const [viewMode, setViewMode] = useState<"standard" | "compact">("standard");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?next=/${params.username}/${params.project}`);
    }
  }, [authLoading, user, router, params.username, params.project]);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const profileRes = await fetch(`/api/profile/${params.username}`);
        if (!profileRes.ok) { setNotFound(true); return; }
        const profileData = await profileRes.json();
        const builderData = profileData.data.profile;
        setBuilder(builderData);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allProjects: any[] = profileData.data.projects ?? [];
        const found = allProjects.find(
          (p) => p.slug === params.project || p.id === params.project
        );
        if (!found) { setNotFound(true); return; }
        setProject(found);

        const entriesRes = await fetch(`/api/journal?project_id=${found.id}`);
        if (entriesRes.ok) {
          const entriesData = await entriesRes.json();
          setEntries((entriesData.data ?? []).map(mapEntryToCardShape));
        }

        const supabase = createClient();
        const { count: projFollowersCount } = await supabase
          .from("project_follows")
          .select("*", { count: "exact", head: true })
          .eq("project_id", found.id);
          
        if (user) {
          const { data: followData } = await supabase
            .from("project_follows")
            .select("follower_id")
            .eq("project_id", found.id)
            .eq("follower_id", user.id)
            .single();
          if (followData) setIsFollowing(true);
        }

        setFollowers(projFollowersCount ?? 0);
      } catch (err) {
        console.error(err);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.username, params.project, user?.id]);

  useEffect(() => {
    if (user && project) {
      const storedProjIds = JSON.parse(localStorage.getItem(`bookmarks_projects_${user.id}`) || "[]");
      setIsBookmarked(storedProjIds.includes(project.id));
    }
  }, [user, project]);

  const handleFollow = async () => {
    if (!user) {
      router.push(`/login?next=/${params.username}/${params.project}`);
      return;
    }
    if (isFollowLoading) return;
    setIsFollowLoading(true);

    try {
      if (isFollowing) {
        const res = await fetch("/api/follows/projects", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project_id: project.id })
        });
        if (res.ok) {
          setIsFollowing(false);
          setFollowers(f => Math.max(0, f - 1));
        }
      } else {
        const res = await fetch("/api/follows/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project_id: project.id, notify: true })
        });
        if (res.ok) {
          setIsFollowing(true);
          setFollowers(f => f + 1);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleBookmark = () => {
    if (!user) {
      router.push(`/login?next=/${params.username}/${params.project}`);
      return;
    }
    const key = `bookmarks_projects_${user.id}`;
    let stored = JSON.parse(localStorage.getItem(key) || "[]");
    
    if (isBookmarked) {
      stored = stored.filter((id: string) => id !== project.id);
    } else {
      if (!stored.includes(project.id)) {
        stored.push(project.id);
      }
    }
    
    localStorage.setItem(key, JSON.stringify(stored));
    setIsBookmarked(!isBookmarked);
  };

  const executeDeleteProject = async () => {
    if (deleteConfirmText !== project.slug.toUpperCase()) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (res.ok) {
        window.dispatchEvent(new Event("projects-updated"));
        router.push(`/${params.username}`);
      } else {
        alert("Failed to delete project.");
        setIsDeleting(false);
      }
    } catch (err) {
      console.error(err);
      setIsDeleting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <PageTransition className="flex flex-col lg:flex-row min-h-screen">
        {/* Main Content Skeleton */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto lg:pr-[332px]">
          <div className="max-w-3xl mx-auto animate-pulse">
            <div className="w-48 h-4 bg-surface rounded mb-8"></div>
            <div className="flex items-start justify-between mb-6">
              <div className="w-2/3 h-10 bg-surface rounded"></div>
              <div className="w-24 h-6 bg-surface rounded"></div>
            </div>
            <div className="w-full h-4 bg-surface rounded mb-3"></div>
            <div className="w-4/5 h-4 bg-surface rounded mb-10"></div>
            
            <div className="w-full h-16 bg-surface rounded mb-10"></div>
            
            <div className="flex gap-4 mb-8 border-b border-border pb-2">
              <div className="w-20 h-4 bg-surface rounded"></div>
              <div className="w-20 h-4 bg-surface rounded"></div>
            </div>
            
            <div className="w-full h-48 bg-surface rounded-lg border border-border mb-6"></div>
            <div className="w-full h-48 bg-surface rounded-lg border border-border"></div>
          </div>
        </div>

        {/* Right Panel Skeleton */}
        <div className="hidden lg:block fixed right-0 top-[48px] bottom-0 w-[300px] bg-surface border-l border-border z-10">
          <div className="p-6 lg:p-8 flex flex-col gap-8 h-full animate-pulse">
            <div>
              <div className="w-32 h-3 bg-surface2 rounded mb-6"></div>
              <div className="space-y-4">
                <div className="flex justify-between border-b border-border2 pb-2">
                  <div className="w-16 h-4 bg-surface2 rounded"></div>
                  <div className="w-16 h-4 bg-surface2 rounded"></div>
                </div>
                <div className="flex justify-between border-b border-border2 pb-2">
                  <div className="w-16 h-4 bg-surface2 rounded"></div>
                  <div className="w-8 h-4 bg-surface2 rounded"></div>
                </div>
                <div className="flex justify-between border-b border-border2 pb-2">
                  <div className="w-16 h-4 bg-surface2 rounded"></div>
                  <div className="w-8 h-4 bg-surface2 rounded"></div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="w-full h-10 bg-surface2 rounded"></div>
              <div className="w-full h-10 bg-surface2 rounded"></div>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!user) return null;

  if (notFound || !project || !builder) {
    return (
      <div className="p-16 text-center">
        <div className="font-mono text-text3 text-xs uppercase tracking-widest mb-4">404</div>
        <h1 className="font-display font-bold text-2xl text-text1 mb-2">Build not found</h1>
        <p className="font-body text-text2 text-sm">This project doesn&apos;t exist on Arcline.</p>
        <Link href="/explore" className="mt-6 inline-block text-accent font-body text-sm hover:underline">← Explore builders</Link>
      </div>
    );
  }

  const startedDate = project.created_at
    ? new Date(project.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "—";

  const isOwner = user?.id === builder?.id;

  const TABS: Array<"Build Log" | "Journey Map"> = ["Build Log", "Journey Map"];

  return (
    <PageTransition className="flex flex-col lg:flex-row min-h-screen">
      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto lg:pr-[332px]">
        <div className="max-w-3xl mx-auto">

          {/* Back link */}
          <Link
            href={`/${builder.username}`}
            className="inline-flex items-center gap-2 text-text3 hover:text-text1 transition-colors text-sm font-medium mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {builder.name}&apos;s profile
          </Link>

          {/* Project header */}
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-4xl font-display font-bold">{project.title}</h1>
            <StageBadge stage={project.stage as string} />
          </div>

          <p className="text-text2 text-lg leading-relaxed mb-6">
            {project.tagline || project.description || ""}
          </p>

          <div className="mb-8">
            {(() => {
              const stageBaselines: Record<string, number> = {
                "STARTED": 8, "BUILDING": 25, "PIVOTING": 35, "STRUGGLING": 45, "SHIPPING": 75, "LAUNCHED": 92
              };
              const baseProgress = stageBaselines[project.stage as string] || 0;
              const wins = entries.filter(e => e.type === "WIN").length;
              const miles = entries.filter(e => e.type === "MILESTONE").length;
              const progress = Math.min(baseProgress + Math.min((wins * 1) + (miles * 3), 10), 100);
              
              const reversed = [...entries].reverse();
              const segments = reversed.map((e, idx) => ({
                type: e.type,
                position: reversed.length === 1 ? progress : (progress / (reversed.length - 1)) * idx,
                title: e.title,
                date: e.date
              }));

              return <JourneyProgressBar progress={progress} segments={segments} />;
            })()}
          </div>

          {/* ── Sticky Tab Bar ──────────────────────────────── */}
          <div
            className="sticky bg-bg border-b border-border mb-8"
            style={{ top: 48, zIndex: 20 }}
          >
            <div className="flex gap-0">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "relative px-5 py-3 font-mono text-[0.72rem] uppercase tracking-widest transition-colors border-b-2 -mb-[2px]",
                    activeTab === tab
                      ? "border-accent text-text1"
                      : "border-transparent text-text3 hover:text-text2"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* ── Tab: Build Log ──────────────────────────────── */}
          {activeTab === "Build Log" && (
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                <h2 className="text-sm font-mono uppercase tracking-widest text-text2">Build Log</h2>
                <div className="flex items-center gap-4">
                  <div className="w-36">
                    <CustomSelect
                      value={filterType}
                      onChange={setFilterType}
                      options={FILTER_OPTIONS}
                    />
                  </div>
                  <div className="flex items-center gap-1 bg-surface2 p-1 border border-border2">
                    <button 
                      onClick={() => setViewMode("standard")}
                      className={cn("p-1.5 transition-colors", viewMode === "standard" ? "bg-surface border border-border2 text-text1" : "bg-transparent border border-transparent text-text3 hover:text-text2")}
                    >
                      <LayoutList className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setViewMode("compact")}
                      className={cn("p-1.5 transition-colors", viewMode === "compact" ? "bg-surface border border-border2 text-text1" : "bg-transparent border border-transparent text-text3 hover:text-text2")}
                    >
                      <Menu className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {(filterType === "ALL" ? entries : entries.filter((e) => e.type === filterType)).length > 0 ? (
                  (filterType === "ALL" ? entries : entries.filter((e) => e.type === filterType)).map((entry) => (
                    <EntryCard key={entry.id} entry={entry} variant={viewMode as any} />
                  ))
                ) : (
                  <div className="text-center py-12 border border-dashed border-border2 bg-surface2/50">
                    <p className="text-text3 font-mono text-sm mb-4">No entries yet.</p>
                    {isOwner && (
                      <Link href="/new-entry">
                        <Button variant="outline" size="sm">Log the first entry</Button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Tab: Journey Map ────────────────────────────── */}
          {activeTab === "Journey Map" && (
            <div className="mb-12">
              <EntryTimeline entries={entries} />
            </div>
          )}
        </div>
      </div>

      {/* Right Panel (Details) */}
      <div className="hidden lg:block fixed right-0 top-[48px] bottom-0 w-[300px] bg-surface border-l border-border z-10">
        <div className="p-6 lg:p-8 flex flex-col gap-8 h-full overflow-y-auto custom-scrollbar">
          <div>
          <h3 className="text-xs font-mono uppercase tracking-widest text-text3 mb-4">About this Build</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-border2 pb-2">
              <span className="text-sm text-text2">Started</span>
              <span className="text-sm text-text1">{startedDate}</span>
            </div>
            <div className="flex justify-between items-center border-b border-border2 pb-2">
              <span className="text-sm text-text2">Entries</span>
              <span className="text-sm text-text1">{entries.length}</span>
            </div>
            <div className="flex justify-between items-center border-b border-border2 pb-2">
              <span className="text-sm text-text2">Followers</span>
              <span className="text-sm text-text1">{followers}</span>
            </div>
          </div>
        </div>

        {!isOwner && (
          <div className="flex flex-col gap-3">
            <Button 
              className={cn("w-full transition-all duration-200", isFollowing ? "bg-surface2 text-text1 border-border2 hover:bg-surface" : "")} 
              onClick={handleFollow} 
              disabled={isFollowLoading}
            >
              {user ? (isFollowing ? "Following" : "Follow this build") : "Sign in to follow"}
            </Button>
            <Button 
              variant="outline" 
              className={cn("w-full gap-2", isBookmarked ? "border-accent text-accent bg-accent/5 hover:bg-accent/10" : "hover:bg-surface2")}
              onClick={handleBookmark}
            >
              <Bookmark className="w-4 h-4" fill={isBookmarked ? "currentColor" : "none"} />
              {isBookmarked ? "Bookmarked" : "Bookmark this build"}
            </Button>
          </div>
        )}
        {isOwner && (
          <Button
            variant="outline"
            className="w-full mt-4 border-red-900/30 text-red-500 hover:bg-red-500/10 hover:border-red-500 hover:text-red-400"
            onClick={() => setShowDeleteModal(true)}
            disabled={isDeleting}
          >
            Delete Build
          </Button>
        )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border w-full max-w-md p-6 shadow-2xl relative">
            <h2 className="font-display font-bold text-2xl text-text1 mb-2">Delete Build</h2>
            <p className="text-text2 text-sm mb-6">
              This action cannot be undone. This will permanently delete the{" "}
              <span className="font-mono text-text1 mx-1">{project.title}</span>{" "}
              build and all of its log entries.
            </p>
            <div className="mb-6">
              <label className="block text-xs font-mono uppercase tracking-widest text-text3 mb-2">
                Please type <span className="text-red-500 font-bold">{project.slug.toUpperCase()}</span> to confirm.
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full bg-bg border border-border2 text-text1 px-4 py-2 font-mono text-sm focus:outline-none focus:border-red-500 transition-colors"
                placeholder={project.slug.toUpperCase()}
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(""); }}>Cancel</Button>
              <button
                className={`px-4 py-2 font-body text-sm font-medium border transition-colors ${
                  deleteConfirmText === project.slug.toUpperCase()
                    ? "bg-transparent border-red-500 text-red-500 hover:bg-red-500/10"
                    : "bg-transparent border-red-900/30 text-red-500/40 cursor-not-allowed"
                }`}
                disabled={deleteConfirmText !== project.slug.toUpperCase() || isDeleting}
                onClick={executeDeleteProject}
              >
                {isDeleting ? "Deleting..." : "I understand, delete this build"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
