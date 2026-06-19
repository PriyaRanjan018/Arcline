"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import PageTransition from "@/components/shared/PageTransition";
import EntryCard from "@/components/shared/EntryCard";
import JourneyProgressBar from "@/components/shared/JourneyProgressBar";
import StageBadge from "@/components/shared/StageBadge";
import Button from "@/components/shared/Button";
import { ArrowLeft, LayoutList, GitCommitHorizontal } from "lucide-react";

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
    type:     dbEntry.type,
    title:    dbEntry.title,
    content:  dbEntry.body,
    date:     new Date(dbEntry.created_at).toLocaleDateString(),
    reactions: { feel: 0, keepGoing: 0, hitMe: 0, beenHere: 0 },
    reaction_count: dbEntry.reaction_count,
  };
}

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
  const [isOwner,   setIsOwner]   = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?next=/${params.username}/${params.project}`);
    }
  }, [authLoading, user, router, params.username, params.project]);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        // 1. Fetch builder profile
        const profileRes = await fetch(`/api/profile/${params.username}`);
        if (!profileRes.ok) { setNotFound(true); return; }
        const profileData = await profileRes.json();
        const builderData = profileData.data.profile;
        setBuilder(builderData);

        // 2. Find the project by slug from the profile's projects list
        const allProjects: any[] = profileData.data.projects ?? [];
        const found = allProjects.find(
          (p) => p.slug === params.project || p.id === params.project
        );
        if (!found) { setNotFound(true); return; }
        setProject(found);

        // 3. Fetch entries for this project
        const entriesRes = await fetch(`/api/entries?project_id=${found.id}`);
        if (entriesRes.ok) {
          const entriesData = await entriesRes.json();
          setEntries((entriesData.data ?? []).map(mapEntryToCardShape));
        }

        // 4. Follower count for project (reuse profile followers as proxy for now)
        setFollowers(builderData.followers ?? 0);

        // 5. Determine ownership
        if (user?.id === builderData.id) setIsOwner(true);
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

  const handleFollow = () => {
    if (!user) {
      router.push(`/login?next=/${params.username}/${params.project}`);
    }
    // TODO: project follow API
  };

  const executeDeleteProject = async () => {
    if (deleteConfirmText !== project.slug.toUpperCase()) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: 'DELETE' });
      if (res.ok) {
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
      <div className="p-16 text-center text-text3 font-mono animate-pulse">
        Loading build log…
      </div>
    );
  }

  if (!user) {
    return null; // Don't render while redirecting
  }

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

  // Calculate a simple momentum % from entry type distribution
  const total = entries.length;
  const wins  = entries.filter(e => e.type === "WIN").length;
  const milestones = entries.filter(e => e.type === "MILESTONE").length;
  const progressPercent = total > 0 ? Math.round(((wins + milestones) / total) * 100) : 0;

  // Build progress segments from actual entry positions
  const progressSegments = entries.map((e, i) => ({
    type: e.type as "WIN" | "SETBACK" | "MILESTONE" | "REALIZATION",
    position: total === 1 ? 50 : Math.round((i / (total - 1)) * 100),
  }));

  const startedDate = project.created_at
    ? new Date(project.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "—";

  return (
    <PageTransition className="flex flex-col lg:flex-row min-h-screen">
      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          {/* Back link */}
          <Link
            href={`/${builder.username}`}
            className="inline-flex items-center gap-2 text-text3 hover:text-text1 transition-colors text-sm font-medium mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {builder.name}&apos;s profile
          </Link>

          <div className="flex items-start justify-between mb-4">
            <h1 className="text-4xl font-display font-bold">{project.title}</h1>
            <StageBadge stage={project.stage as any} />
          </div>

          <p className="text-text2 text-lg leading-relaxed mb-8">
            {project.tagline || project.description || ""}
          </p>

          {/* Journey Progress */}
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-widest text-text3">Journey Momentum</span>
            <span className="text-xs font-mono text-accent">{progressPercent}%</span>
          </div>
          <JourneyProgressBar progress={progressPercent} segments={progressSegments} className="mb-12" />

          {/* Feed Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
            <h2 className="text-sm font-mono uppercase tracking-widest text-text2">Build Log</h2>
            <div className="flex items-center gap-2 bg-surface2 p-1 border border-border2">
              <button className="p-1.5 bg-surface border border-border2 text-text1"><LayoutList className="w-4 h-4" /></button>
              <button className="p-1.5 text-text3 hover:text-text1 transition-colors"><GitCommitHorizontal className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Entries */}
          <div className="space-y-6">
            {entries.length > 0 ? (
              entries.map((entry) => (
                <EntryCard key={entry.id} entry={entry} variant="standard" />
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
      </div>

      {/* Right Panel (Details) */}
      <div className="w-full lg:w-[320px] bg-surface border-l border-border p-6 lg:p-8 flex flex-col gap-8 hidden lg:flex">
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
          <Button className="w-full" onClick={handleFollow}>
            {user ? "Follow this build" : "Sign in to follow"}
          </Button>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border w-full max-w-md p-6 shadow-2xl relative">
            <h2 className="font-display font-bold text-2xl text-text1 mb-2">Delete Build</h2>
            <p className="text-text2 text-sm mb-6">
              This action cannot be undone. This will permanently delete the 
              <span className="font-mono text-text1 mx-1">{project.title}</span> 
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
