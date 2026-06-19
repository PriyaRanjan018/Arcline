"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import PageTransition from "@/components/shared/PageTransition";
import EntryCard from "@/components/shared/EntryCard";
import ProjectCard from "@/components/shared/ProjectCard";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

// Base tabs shown to everyone
const GUEST_TABS = [
  { id: "for-you",   label: "For You"   },
  { id: "latest",    label: "Latest"    },
  { id: "setbacks",  label: "Setbacks"  },
  { id: "wins",      label: "Wins"      },
  { id: "trending",  label: "Trending"  },
];

// Extra tab injected after "For You" for logged-in users
const FOLLOWING_TAB = { id: "following", label: "Following" };

const LOGGED_IN_TABS = [
  GUEST_TABS[0],        // For You
  FOLLOWING_TAB,        // Following  ← auth-only
  ...GUEST_TABS.slice(1), // Latest, Setbacks, Wins, Trending
];

// Map backend DB entries to the shape EntryCard expects
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEntryToCardShape(dbEntry: any) {
  return {
    id: dbEntry.id,
    projectId: dbEntry.project.title, // or slug
    builder: {
      username: dbEntry.author.username,
      name: dbEntry.author.name,
      initials: dbEntry.author.name.substring(0, 2).toUpperCase(),
      avatarBg: "bg-surface2", // Fallback
    },
    type: dbEntry.type,
    title: dbEntry.title,
    content: dbEntry.body,
    date: new Date(dbEntry.created_at).toLocaleDateString(),
    reactions: {
      feel: 0, keepGoing: 0, hitMe: 0, beenHere: 0 // Will be handled by ReactionBar via initialCounts
    },
    reaction_count: dbEntry.reaction_count,
  };
}

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Derive visible tabs based on auth state
  const TABS = user ? LOGGED_IN_TABS : GUEST_TABS;

  // If a logged-out user has ?tab=following in the URL, fall back to "for-you"
  const rawTab = searchParams.get("tab") || "for-you";
  const defaultTab = !user && rawTab === "following" ? "for-you" : rawTab;

  const [activeTab, setActiveTab] = useState(defaultTab);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [feed, setFeed] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [featuredProjects, setFeaturedProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Keep activeTab in sync once auth resolves
  useEffect(() => {
    if (!authLoading && !user && activeTab === "following") {
      setActiveTab("for-you");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  // Fetch featured projects once
  useEffect(() => {
    fetch("/api/projects")
      .then(r => r.json())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(json => setFeaturedProjects(json.data ?? []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    // Don't fetch while we still don't know auth state
    if (authLoading) return;

    async function fetchFeed() {
      setIsLoading(true);
      try {
        let endpoint = "/api/feed/explore";
        let queryParams = "";

        switch (activeTab) {
          case "for-you":
            // Logged-in → personalised feed; guest → latest public feed
            if (user) {
              endpoint = "/api/feed";
            } else {
              queryParams = "?sort=latest";
            }
            break;
          case "following":
            // Only reachable when logged in
            endpoint = "/api/feed";
            break;
          case "latest":
            queryParams = "?sort=latest";
            break;
          case "setbacks":
            queryParams = "?type=SETBACK";
            break;
          case "wins":
            queryParams = "?type=WIN";
            break;
          case "trending":
            queryParams = "?sort=trending";
            break;
        }

        const res = await fetch(`${endpoint}${queryParams}`);
        let fetchedFeed: any[] = [];
        
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.length > 0) {
            fetchedFeed = json.data.map(mapEntryToCardShape);
          }
        }

        setFeed(fetchedFeed);
      } catch (err) {
        console.error(err);
        setFeed([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFeed();
  }, [activeTab, user, authLoading]);

  function handleTabChange(tabId: string) {
    setActiveTab(tabId);
    router.replace(`/explore?tab=${tabId}`, { scroll: false });
  }

  return (
    <PageTransition className="pb-8 max-w-5xl mx-auto w-full">
      {/* ── Page header ─────────────────────────────────── */}
      <div className="px-4 md:px-8 pt-8 pb-4">
        <h1 className="text-3xl font-display font-bold">Explore Journeys</h1>
      </div>

      {/* ── Tab Bar — sticky, frosted ────────────────────── */}
      <div className="sticky top-[48px] z-30 bg-[rgba(8,8,8,0.90)] backdrop-blur-[12px] border-b border-border mb-8">
        <div className="px-4 md:px-8">
          <div className="flex items-end gap-0 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "relative flex items-center gap-2 pt-4 pb-3 px-5 text-sm font-medium",
                    "whitespace-nowrap transition-all duration-200 group",
                    isActive ? "text-text1" : "text-text3 hover:text-text2"
                  )}
                >
                  <span>{tab.label}</span>

                  {/* "Members only" lock badge on the Following tab */}
                  {tab.id === "following" && !isActive && (
                    <span className="text-[9px] font-mono text-accent/60">🔒</span>
                  )}
                  {tab.id === "following" && isActive && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 leading-none bg-accentDim text-accent">
                      You
                    </span>
                  )}

                  {/* Setbacks dot */}
                  {tab.id === "setbacks" && !isActive && (
                    <span className="text-[9px] font-mono text-setback opacity-60">●</span>
                  )}
                  {isActive && tab.id === "setbacks" && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 leading-none transition-colors bg-[rgba(255,152,0,0.15)] text-setback">
                      Live
                    </span>
                  )}

                  {/* Active underline */}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px]"
                      style={{
                        backgroundColor: tab.id === "setbacks" ? "var(--setback)" : "var(--accent)",
                        borderRadius: 0,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────── */}
      <div className="px-4 md:px-8">
        
        {/* Guest Banner */}
        {!user && !authLoading && (
          <div 
            className="mb-[20px] p-[20px_32px] border border-[#222222] border-t-[3px] border-t-[#E8572A] flex flex-col md:flex-row md:items-center justify-between gap-6"
            style={{ background: "linear-gradient(135deg, #111111 0%, #0D0D0D 100%)" }}
          >
            <div>
              <h2 className="font-display font-bold text-[1.2rem] text-[#F2EDE4]">
                See journeys from builders like you
              </h2>
              <p className="font-body font-light text-[0.82rem] text-[#888888] mt-[6px]">
                Create your free account to personalise your feed and follow the journeys that matter to you.
              </p>
            </div>
            <div className="flex items-center gap-[8px] flex-shrink-0">
              <Link 
                href="/login?next=/explore"
                className="px-[16px] py-[10px] bg-[#E8572A] font-body font-medium text-[0.8rem] text-white hover:bg-[#D14820] transition-colors"
              >
                Create free account &rarr;
              </Link>
              <Link 
                href="/login?next=/explore"
                className="px-[16px] py-[10px] border border-transparent font-body font-medium text-[0.8rem] text-[#888888] hover:text-[#F2EDE4] transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>
        )}

        {/* Featured Journeys */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-mono uppercase tracking-widest text-text3">Featured Journeys</h2>
            <span className="text-[10px] font-mono text-text3 animate-pulse">scroll →</span>
          </div>
          {/* Bleed the carousel past the parent padding so a partial card peeks at the edge */}
          <div className="relative">
            <div
              className="pointer-events-none absolute right-0 top-0 bottom-4 w-16 z-10"
              style={{ background: "linear-gradient(to right, transparent, #080808)" }}
            />
            <div
              className="flex gap-4 overflow-x-auto pb-4 snap-x -mx-4 md:-mx-8 px-4 md:px-8"
              style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
            >
              {featuredProjects.length > 0 ? (
                featuredProjects.map((project) => (
                  <div key={project.id} className="min-w-[240px] max-w-[260px] snap-start flex-shrink-0">
                    <ProjectCard project={project} />
                  </div>
                ))
              ) : (
                <p className="text-text3 font-mono text-xs py-8">No builds yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6 text-[10px] font-mono text-[#555555] uppercase tracking-widest">
          <div className="flex items-center gap-4">
            <span>{isLoading ? "Loading..." : `${feed.length} entries`}</span>
          </div>
          {activeTab === "setbacks" && (
            <span className="text-setback border border-setback/30 px-2 py-0.5">
              Setbacks are first-class here
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="border border-dashed border-border2 p-16 text-center">
            <p className="text-text3 font-mono text-sm animate-pulse">Loading feed...</p>
          </div>
        ) : activeTab === "following" && !user ? (
          // Safeguard: guest somehow got to Following tab
          <div className="border border-dashed border-border2 p-16 text-center space-y-4">
            <p className="text-text2 font-mono text-sm">Sign in to see entries from builders you follow.</p>
            <a
              href="/login?next=/explore?tab=following"
              className="inline-block px-6 py-2 border border-accent text-accent text-xs font-mono uppercase tracking-widest hover:bg-accentDim transition-colors"
            >
              Sign In
            </a>
          </div>
        ) : feed.length > 0 ? (
          <div className="space-y-6">
            {feed.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-border2 p-16 text-center">
            {activeTab === "following" ? (
              <>
                <p className="text-text3 font-mono text-sm mb-4">No entries from people you follow yet.</p>
                <a
                  href="/explore?tab=latest"
                  className="text-accent text-xs font-mono underline underline-offset-4"
                >
                  Explore latest builders →
                </a>
              </>
            ) : (
              <p className="text-text3 font-mono text-sm">No entries found.</p>
            )}
          </div>
        )}
      </div>
    </PageTransition>

  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="p-8 text-text3 font-mono text-sm">Loading…</div>}>
      <ExploreContent />
    </Suspense>
  );
}
