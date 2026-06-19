"use client";

import React, { useState, useEffect } from "react";
import PageTransition from "@/components/shared/PageTransition";
import Button from "@/components/shared/Button";
import Link from "next/link";
import { Bookmark, Compass, Search, Folder, MessageSquare, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ProjectCard from "@/components/shared/ProjectCard";
import EntryCard from "@/components/shared/EntryCard";

export default function BookmarksPage() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<"projects" | "entries">("projects");
  const [searchQuery, setSearchQuery] = useState("");
  const [bookmarkedProjects, setBookmarkedProjects] = useState<any[]>([]);
  const [bookmarkedEntries, setBookmarkedEntries] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading || !user) return;

    // Load from localstorage and fetch metadata if needed
    // In a real database we would store this in a bookmarks/stars table.
    // For now we simulate with localStorage which is highly robust and stateful!
    async function loadBookmarks() {
      try {
        const storedProjIds = JSON.parse(localStorage.getItem(`bookmarks_projects_${user?.id}`) || "[]");
        const storedEntryIds = JSON.parse(localStorage.getItem(`bookmarks_entries_${user?.id}`) || "[]");

        if (storedProjIds.length > 0) {
          const res = await fetch("/api/projects");
          if (res.ok) {
            const json = await res.json();
            const filtered = (json.data || []).filter((p: any) => storedProjIds.includes(p.id));
            setBookmarkedProjects(filtered);
          }
        }

        if (storedEntryIds.length > 0) {
          const res = await fetch("/api/feed/explore?limit=50");
          if (res.ok) {
            const json = await res.json();
            const filtered = (json.data || []).filter((e: any) => storedEntryIds.includes(e.id));
            // Map shape
            const mapped = filtered.map((dbEntry: any) => ({
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
            }));
            setBookmarkedEntries(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to load bookmarks", err);
      } finally {
        setFetching(false);
      }
    }

    loadBookmarks();
  }, [user, loading]);

  if (loading || (user && fetching)) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-48px)]">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-16 text-center max-w-md mx-auto">
        <Bookmark className="w-12 h-12 text-text3 mx-auto mb-4" />
        <h2 className="text-xl font-display font-bold mb-2">Sign in to view bookmarks</h2>
        <p className="text-text2 text-sm mb-6">Keep track of your favorite builds, milestones, and setbacks in one place.</p>
        <Link href="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  const filteredProjects = bookmarkedProjects.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.tagline && p.tagline.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredEntries = bookmarkedEntries.filter(e =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageTransition className="max-w-5xl mx-auto w-full px-4 md:px-8 py-8 min-h-[calc(100vh-48px)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-6 mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text1 flex items-center gap-2">
            <Bookmark className="w-8 h-8 text-accent" />
            Bookmarks
          </h1>
          <p className="text-text2 text-sm mt-1">Your saved builds and log entries.</p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text3" />
          <input
            type="text"
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-border text-sm text-text1 rounded-none pl-9 pr-4 py-2 focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border2 mb-6">
        <button
          onClick={() => setActiveTab("projects")}
          className={`px-4 py-2 font-mono text-sm border-b-2 -mb-[2px] transition-colors flex items-center gap-2 ${
            activeTab === "projects"
              ? "border-accent text-accent font-bold"
              : "border-transparent text-text3 hover:text-text2"
          }`}
        >
          <Folder className="w-4 h-4" />
          Builds ({filteredProjects.length})
        </button>
        <button
          onClick={() => setActiveTab("entries")}
          className={`px-4 py-2 font-mono text-sm border-b-2 -mb-[2px] transition-colors flex items-center gap-2 ${
            activeTab === "entries"
              ? "border-accent text-accent font-bold"
              : "border-transparent text-text3 hover:text-text2"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Log Entries ({filteredEntries.length})
        </button>
      </div>

      {/* Content */}
      <div>
        {activeTab === "projects" ? (
          filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} username={(project as any).profiles?.username || "builder"} />
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-border2 p-16 text-center max-w-lg mx-auto">
              <Compass className="w-12 h-12 text-text3 mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-display font-bold mb-2">No bookmarked builds</h3>
              <p className="text-text2 text-sm mb-6">When exploring projects, click bookmark to save them for quick reference.</p>
              <Link href="/explore">
                <Button>Explore builds</Button>
              </Link>
            </div>
          )
        ) : (
          filteredEntries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredEntries.map((entry) => (
                <EntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-border2 p-16 text-center max-w-lg mx-auto">
              <Compass className="w-12 h-12 text-text3 mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-display font-bold mb-2">No bookmarked entries</h3>
              <p className="text-text2 text-sm mb-6">Save helpful realizations or major milestones from other builders.</p>
              <Link href="/explore">
                <Button>Explore entries</Button>
              </Link>
            </div>
          )
        )}
      </div>
    </PageTransition>
  );
}
