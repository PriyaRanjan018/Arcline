"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import PageTransition from "@/components/shared/PageTransition";
import Button from "@/components/shared/Button";
import EntryCard from "@/components/shared/EntryCard";
import { useAuth } from "@/contexts/AuthContext";

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

export default function LandingPage() {
  const { user, loading } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [entries,  setEntries]  = useState<any[]>([]);
  const [stats,    setStats]    = useState({ builders: 0, entries: 0 });

  useEffect(() => {
    async function fetchData() {
      try {
        const [feedRes, statsRes] = await Promise.all([
          fetch("/api/feed/explore?sort=latest&limit=6"),
          fetch("/api/stats"),
        ]);
        if (feedRes.ok) {
          const json = await feedRes.json();
          setEntries((json.data ?? []).map(mapEntryToCardShape));
        }
        if (statsRes.ok) {
          const json = await statsRes.json();
          setStats({ builders: json.builders, entries: json.entries });
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-48px)]">
        <div className="animate-pulse w-10 h-10 border border-[#222222] bg-[#111111]" />
      </div>
    );
  }

  if (user) {
    redirect("/dashboard");
  }

  return (
    <PageTransition className="flex flex-col md:flex-row h-[calc(100vh-48px)]">
      {/* Sticky Left Panel */}
      <div className="w-full md:w-[320px] md:fixed md:left-0 md:top-[48px] md:bottom-0 bg-surface border-r border-border p-8 flex flex-col justify-center">
        <h1
          className="font-display font-black text-text1 mb-6"
          style={{ fontSize: "clamp(2.8rem, 4.7vw, 4.8rem)", lineHeight: 1.05, letterSpacing: "-0.03em" }}
        >
          Proof<br />
          of <span className="ml-3">work</span><br />
          NOT<br />
          <span className="italic text-accent" style={{ fontSize: "4.2rem" }}>perfection.</span>
        </h1>
        <p className="text-text2 mb-8 text-sm leading-relaxed">
          Arcline is a proof-of-work platform for builders. Stop curating a perfect grid. Start documenting the struggles, pivots, and realizations that actually make you dangerous.
        </p>
        <div className="flex flex-col gap-4">
          <Link href="/explore" className="w-full">
            <Button className="w-full" size="lg">Explore Journeys</Button>
          </Link>
          <Link href="/login" className="w-full">
            <Button variant="outline" size="lg" className="w-full">Join Free</Button>
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex gap-4">
            <div>
              <div className="text-2xl font-mono text-text1">
                {stats.entries > 0 ? stats.entries.toLocaleString() : "—"}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-text3 font-mono mt-1">Entries Logged</div>
            </div>
            <div>
              <div className="text-2xl font-mono text-text1">
                {stats.builders > 0 ? stats.builders.toLocaleString() : "—"}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-text3 font-mono mt-1">Builders</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Main */}
      <div className="flex-1 md:ml-[320px] p-4 md:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
            <h2 className="text-sm font-mono uppercase tracking-widest text-text2">Latest Proof of Work</h2>
            <Link href="/explore" className="text-sm text-accent hover:text-white transition-colors font-medium">
              View all &rarr;
            </Link>
          </div>

          {entries.length > 0 ? (
            <div className="columns-1 md:columns-2 gap-4 space-y-4">
              {entries.map((entry) => (
                <div key={entry.id} className="break-inside-avoid">
                  <EntryCard entry={entry} />
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-border2 p-16 text-center">
              <p className="text-text3 font-mono text-sm animate-pulse">Loading entries…</p>
            </div>
          )}

          <div className="mt-16 bg-surface2 border border-border2 p-8 text-center flex flex-col items-center">
            <h2 className="text-2xl font-display font-bold mb-3">Ready to build in public?</h2>
            <p className="text-text2 mb-6 max-w-md">Join a community of builders who value transparency over polish.</p>
            <Link href="/login">
              <Button size="lg">Claim Your Profile</Button>
            </Link>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
