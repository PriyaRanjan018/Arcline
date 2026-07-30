"use client";

import { useState, useEffect } from "react";
import { Flame, ArrowUpCircle, Zap, Hand } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface Reactions {
  FEEL_THIS: number;
  KEEP_GOING: number;
  HIT_ME: number;
  BEEN_HERE: number;
  [key: string]: number;
}

const REACTION_DEFS = [
  { key: "FEEL_THIS",  label: "Feel this",  icon: Flame         },
  { key: "KEEP_GOING", label: "Keep going", icon: ArrowUpCircle },
  { key: "HIT_ME",     label: "Hit me",     icon: Zap           },
  { key: "BEEN_HERE",  label: "Been here",  icon: Hand          },
];

export default function ReactionBar({
  entryId,
  initialCounts,
  initialUserReactions = [],
  className,
  onCountChange,
}: {
  entryId: string;
  initialCounts: Reactions;
  initialUserReactions?: string[];
  className?: string;
  /** Called with new total reaction count after any toggle */
  onCountChange?: (total: number) => void;
}) {
  const { user }   = useAuth();
  const router     = useRouter();
  const [counts, setCounts] = useState<Reactions>(initialCounts);
  const [active, setActive] = useState<Set<string>>(new Set(initialUserReactions));

  useEffect(() => {
    async function loadReactions() {
      try {
        const res = await fetch(`/api/journal/${entryId}/reactions`);
        if (res.ok) {
          const { data } = await res.json();
          if (data) {
            setCounts(data.counts);
            setActive(new Set(data.userReactions));
          }
        }
      } catch (err) {
        console.error("Failed to load reactions:", err);
      }
    }
    loadReactions();
  }, [entryId, user]);

  async function toggle(key: string) {
    if (!user) { router.push("/login"); return; }

    const isActive = active.has(key);

    // Optimistic UI update
    const newCounts = {
      ...counts,
      [key]: Math.max(0, (counts[key] || 0) + (isActive ? -1 : 1)),
    };
    setActive(prev => {
      const next = new Set(prev);
      isActive ? next.delete(key) : next.add(key);
      return next;
    });
    setCounts(newCounts);

    // Notify parent card with new aggregate total
    if (onCountChange) {
      const total = Object.values(newCounts).reduce((a, b) => a + b, 0);
      onCountChange(total);
    }

    try {
      await fetch(`/api/journal/${entryId}/reactions`, {
        method: isActive ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: key }),
      });
    } catch (err) {
      console.error("Failed to toggle reaction:", err);
    }
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {REACTION_DEFS.map(({ key, label, icon: Icon }) => {
        const isActive = active.has(key);
        return (
          <button
            key={key}
            onClick={() => toggle(key)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium",
              "transition-all duration-150 select-none",
              isActive
                ? "bg-accentDim border-accent text-accent"
                : "bg-surface border-border2 text-text2 hover:border-text3 hover:text-text1"
            )}
          >
            <Icon className={cn("w-3.5 h-3.5", isActive && "text-accent")} />
            <span>{label}</span>
            {counts[key] > 0 && (
              <span className={cn(
                "tabular-nums text-[10px] ml-0.5",
                isActive ? "text-accent" : "text-text3"
              )}>
                {counts[key]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
