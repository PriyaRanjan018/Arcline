"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PageTransition from "@/components/shared/PageTransition";
import EntryCard from "@/components/shared/EntryCard";
import Button from "@/components/shared/Button";
import Avatar from "@/components/shared/Avatar";
import { useAuth } from "@/contexts/AuthContext";
import { Bookmark, Flame } from "lucide-react";

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
    type:    dbEntry.type,
    title:   dbEntry.title,
    content: dbEntry.body,
    date:    new Date(dbEntry.created_at).toLocaleDateString(),
    reactions: { feel: 0, keepGoing: 0, hitMe: 0, beenHere: 0 },
    reaction_count: dbEntry.reaction_count,
  };
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [feed,      setFeed]      = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [suggested, setSuggested] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [trendingBuilds, setTrendingBuilds] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recentBookmarks, setRecentBookmarks] = useState<any[]>([]);
  const [wins,      setWins]      = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function fetchAll() {
      try {
        const [feedRes, exploreRes, projectsRes] = await Promise.all([
          fetch("/api/feed"),
          fetch("/api/feed/explore?sort=latest&limit=5"),
          fetch("/api/projects")
        ]);

        if (feedRes.ok) {
          const json = await feedRes.json();
          if (json.data) {
            setFeed(json.data.map(mapEntryToCardShape));
            // Count wins in the feed
            const winCount = json.data.filter((e: any) => e.type === "WIN").length;
            setWins(winCount);
          }
        }

        // Use explore feed to find builders to suggest (exclude self)
        if (exploreRes.ok) {
          const json = await exploreRes.json();
          const seen = new Set<string>();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const builders: any[] = [];
          for (const entry of (json.data ?? [])) {
            const username = entry.author?.username;
            if (username && username !== profile?.username && !seen.has(username)) {
              seen.add(username);
              builders.push(entry.author);
            }
            if (builders.length >= 3) break;
          }
          setSuggested(builders);
        }

        if (projectsRes.ok) {
          const json = await projectsRes.json();
          const allProjects = json.data || [];
          
          // Trending builds: exclude self, take first 3
          const publicProjects = allProjects.filter((p: any) => p.profiles?.username !== profile?.username);
          setTrendingBuilds(publicProjects.slice(0, 3));
          
          // Recent bookmarks: check local storage
          const storedProjIds = JSON.parse(localStorage.getItem(`bookmarks_projects_${user!.id}`) || "[]");
          const bookmarkedProjects = allProjects.filter((p: any) => storedProjIds.includes(p.id));
          setRecentBookmarks(bookmarkedProjects.slice(0, 3));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile?.username]);

  return (
    <PageTransition className="flex flex-col min-h-[calc(100vh-48px)] relative">
      {/* Main Feed */}
      <div className="flex-1 p-4 md:p-8 lg:mr-[320px]">
        <div className="max-w-3xl mx-auto">
          {/* Write Prompt Card */}
          <div className="bg-surface border border-border p-6 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar
                initials={profile?.name ? profile.name.substring(0, 2).toUpperCase() : "..."}
                src={profile?.avatar_url ?? undefined}
                bgColor="bg-accent"
              />
              <span className="text-text2 text-sm">
                {profile ? `What's next, ${profile.name.split(" ")[0]}?` : "Document your momentum today..."}
              </span>
            </div>
            <Link href="/new-entry">
              <Button size="sm">New Entry +</Button>
            </Link>
          </div>

          <h1 className="text-2xl font-display font-bold mb-6">Feed</h1>

          <div className="space-y-6">
            {isLoading ? (
              <div className="border border-dashed border-border2 p-16 text-center animate-pulse">
                <p className="text-text3 font-mono text-sm">Loading feed...</p>
              </div>
            ) : feed.length > 0 ? (
              feed.map((entry) => (
                <EntryCard key={entry.id} entry={entry} variant="feed" />
              ))
            ) : (
              <div className="border border-dashed border-border2 p-16 text-center">
                <p className="text-text3 font-mono text-sm mb-4">No entries in your feed yet.</p>
                <Link href="/explore">
                  <Button variant="outline" size="sm">Explore Builders to Follow</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="fixed right-0 top-[48px] bottom-0 w-[320px] bg-surface border-l border-border p-6 hidden lg:block overflow-y-auto custom-scrollbar">
        <h3 className="text-xs font-mono uppercase tracking-widest text-text3 mb-6">Your Stats</h3>
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-surface2 border border-border2 p-4 text-center">
            <div className="text-2xl font-mono text-accent">{profile?.entry_count ?? 0}</div>
            <div className="text-[10px] uppercase text-text3 mt-1">Entries</div>
          </div>
          <div className="bg-surface2 border border-border2 p-4 text-center">
            <div className="text-2xl font-mono text-win">{wins}</div>
            <div className="text-[10px] uppercase text-text3 mt-1">Wins</div>
          </div>
        </div>

        <h3 className="text-xs font-mono uppercase tracking-widest text-text3 mb-6">Suggested Builders</h3>
        <div className="space-y-4">
          {suggested.length > 0 ? (
            suggested.map((builder) => (
              <div key={builder.username} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar
                    initials={(builder.name ?? "??").substring(0, 2).toUpperCase()}
                    src={builder.avatar_url}
                    bgColor="bg-surface2"
                    size="sm"
                  />
                  <div>
                    <div className="text-sm font-medium hover:text-accent transition-colors">
                      <Link href={`/${builder.username}`}>{builder.name}</Link>
                    </div>
                    <div className="text-xs text-text3">@{builder.username}</div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs border border-border2">Follow</Button>
              </div>
            ))
          ) : (
            <p className="text-text3 font-mono text-xs">
              {isLoading ? "Loading…" : "No suggestions yet."}
            </p>
          )}
        </div>

        <h3 className="text-xs font-mono uppercase tracking-widest text-text3 mb-6 mt-10">Trending Builds</h3>
        <div className="space-y-4">
          {trendingBuilds.length > 0 ? (
            trendingBuilds.map((project) => (
              <div key={project.id} className="flex flex-col">
                <Link href={`/${project.profiles?.username || "builder"}/${project.slug}`} className="font-body text-sm text-text1 hover:text-accent transition-colors flex items-center gap-2">
                  <Flame className="w-3 h-3 text-accent" />
                  {project.title}
                </Link>
                <div className="font-mono text-[10px] text-text3 mt-1 truncate">
                  by @{project.profiles?.username || "builder"}
                </div>
              </div>
            ))
          ) : (
            <p className="text-text3 font-mono text-xs">
              {isLoading ? "Loading…" : "No trending builds."}
            </p>
          )}
        </div>

        <h3 className="text-xs font-mono uppercase tracking-widest text-text3 mb-6 mt-10">Recent Bookmarks</h3>
        <div className="space-y-4">
          {recentBookmarks.length > 0 ? (
            recentBookmarks.map((project) => (
              <div key={project.id} className="flex flex-col">
                <Link href={`/${project.profiles?.username || "builder"}/${project.slug}`} className="font-body text-sm text-text1 hover:text-accent transition-colors flex items-center gap-2">
                  <Bookmark className="w-3 h-3 text-text2" />
                  {project.title}
                </Link>
                <div className="font-mono text-[10px] text-text3 mt-1 truncate">
                  by @{project.profiles?.username || "builder"}
                </div>
              </div>
            ))
          ) : (
            <p className="text-text3 font-mono text-xs">
              {isLoading ? "Loading…" : "No bookmarks yet."}
            </p>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
