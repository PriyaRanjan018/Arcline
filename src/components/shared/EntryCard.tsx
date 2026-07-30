"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Trash2, Bookmark, Heart, MessageCircle } from "lucide-react";
import { animations } from "@/lib/animations";
import { cn } from "@/lib/utils";
import Avatar from "./Avatar";
import ReactionBar from "./ReactionBar";

interface EntryCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entry: any;
  variant?: "standard" | "spotlight" | "feed" | "compact" | "detail";
  className?: string;
  onDelete?: (id: string) => void;
}

// ── Type metadata ────────────────────────────────────────────────
const TYPE_CONFIG = {
  WIN:         { color: "#4CAF50", label: "Win"         },
  SETBACK:     { color: "#FF9800", label: "Setback"     },
  MILESTONE:   { color: "#7EB8F5", label: "Milestone"   },
  REALIZATION: { color: "#C9A96E", label: "Realization" },
} as const;

export default function EntryCard({ entry, variant = "standard", className, onDelete }: EntryCardProps) {
  const { profile, user } = useAuth();
  const [isDeleting, setIsDeleting]           = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isBookmarked, setIsBookmarked]       = useState(false);
  const [showReactions, setShowReactions]     = useState(false);
  const [reactionCount, setReactionCount]     = useState(
    entry.reactionCount ?? entry.reaction_count ?? 0
  );

  const isOwner = profile?.username === entry.builder.username;
  const typeConfig = TYPE_CONFIG[entry.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.WIN;

  // Derive day number / entry number label
  const dayNumber: number | null = entry.dayNumber ?? entry.day_number ?? null;
  const commentCount: number = entry.commentCount ?? entry.comment_count ?? 0;

  useEffect(() => {
    if (!user) return;
    const stored = JSON.parse(localStorage.getItem(`bookmarks_entries_${user.id}`) || "[]");
    setIsBookmarked(stored.includes(entry.id));
  }, [user, entry.id]);

  const handleBookmark = () => {
    if (!user) { alert("Please sign in to bookmark entries"); return; }
    const key     = `bookmarks_entries_${user.id}`;
    const stored  = JSON.parse(localStorage.getItem(key) || "[]");
    if (isBookmarked) {
      localStorage.setItem(key, JSON.stringify(stored.filter((id: string) => id !== entry.id)));
      setIsBookmarked(false);
    } else {
      stored.push(entry.id);
      localStorage.setItem(key, JSON.stringify(stored));
      setIsBookmarked(true);
    }
  };

  const executeDelete = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/journal/${entry.id}`, { method: "DELETE" });
      if (res.ok) {
        onDelete ? onDelete(entry.id) : window.location.reload();
      } else {
        alert("Failed to delete entry");
        setIsDeleting(false);
      }
    } catch (err) {
      console.error(err);
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      variants={animations.staggerItem}
      whileHover={{ y: -1 }}
      viewport={{ once: true, margin: "-50px" }}
      className={cn(
        "bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3.5 relative",
        "hover:border-border2 transition-colors duration-200",
        className
      )}
    >
      {/* ── Top bar: type dot + label  |  day number ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Pulsing type-colour dot */}
          <span
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: typeConfig.color,
              boxShadow: `0 0 0 0 ${typeConfig.color}`,
              animation: "typeDotPulse 2.5s infinite",
            }}
          />
          <span className="text-xs font-medium text-text2">{typeConfig.label}</span>
        </div>
        {dayNumber != null && (
          <span className="text-xs text-text3 tabular-nums">
            #{String(dayNumber).padStart(3, "0")}
          </span>
        )}
      </div>

      {/* ── Builder info ── */}
      <div className="flex items-center gap-2.5">
        <Link href={`/${entry.builder.username}`} className="flex-shrink-0">
          <Avatar
            initials={entry.builder.initials}
            src={entry.builder.avatarUrl || entry.builder.avatar_url}
            bgColor={entry.builder.avatarBg}
            size="sm"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              href={`/${entry.builder.username}`}
              className="text-sm font-medium text-text1 hover:text-accent transition-colors leading-tight"
            >
              {entry.builder.name}
            </Link>
            <span className="text-text3 text-[11px]">·</span>
            <span className="text-[11px] text-text3">{entry.date}</span>
          </div>
          {entry.projectId && (
            <Link 
              href={`/${entry.builder.username}/${entry.projectSlug || entry.projectId}`}
              className="text-[11px] text-text3 hover:text-text2 transition-colors truncate block mt-0.5"
            >
              {entry.projectId}
            </Link>
          )}
        </div>
      </div>

      {/* ── Title ── */}
      <h3
        className={cn(
          "font-semibold text-text1 leading-snug",
          variant === "compact" ? "text-base" : "text-[1.1rem]"
        )}
      >
        {entry.title}
      </h3>

      {/* ── Content preview ── */}
      {variant !== "compact" && entry.content && (
        <p className={cn("text-sm text-text2 leading-relaxed -mt-1", variant !== "detail" && "line-clamp-3")}>
          {entry.content}
        </p>
      )}

      {/* ── Tag pills ── */}
      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 -mt-0.5">
          {entry.tags.map((tag: string) => (
            <span
              key={tag}
              className="px-2.5 py-0.5 rounded-full border border-border2 text-[11px] text-text2 bg-surface2"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* ── Expanded Reactions ── */}
      {showReactions && (
        <div className="border-t border-border pt-3">
          <ReactionBar
            entryId={entry.id}
            initialCounts={{
              FEEL_THIS:  entry.reactions?.feel      || 0,
              KEEP_GOING: entry.reactions?.keepGoing || 0,
              HIT_ME:     entry.reactions?.hitMe     || 0,
              BEEN_HERE:  entry.reactions?.beenHere  || 0,
            }}
            initialUserReactions={[]}
            onCountChange={(total) => setReactionCount(total)}
          />
        </div>
      )}

      {/* ── Footer ── */}
      <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
        {/* Left: ♥ count + 💬 count */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowReactions((p) => !p)}
            className={cn(
              "flex items-center gap-1.5 transition-colors group",
              showReactions ? "text-accent" : "text-text3 hover:text-accent"
            )}
          >
            <Heart
              className="w-4 h-4 group-hover:scale-110 transition-transform"
              fill={showReactions ? "currentColor" : "none"}
            />
            <span className="text-xs tabular-nums">{reactionCount}</span>
          </button>

          <div className="flex items-center gap-1.5 text-text3">
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs tabular-nums">{commentCount}</span>
          </div>
        </div>

        {/* Right: owner controls + View → */}
        <div className="flex items-center gap-1">
          {!isOwner && (
            <button
              onClick={handleBookmark}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                isBookmarked ? "text-accent" : "text-text3 hover:text-text1"
              )}
              title={isBookmarked ? "Remove Bookmark" : "Bookmark Entry"}
            >
              <Bookmark
                className="w-3.5 h-3.5"
                fill={isBookmarked ? "currentColor" : "none"}
              />
            </button>
          )}

          {isOwner && (
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={isDeleting}
              className="p-1.5 rounded-lg text-text3 hover:text-red-400 transition-colors disabled:opacity-50"
              title="Delete Entry"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {variant !== "detail" && (
            <Link
              href={`/${entry.builder.username}/${entry.projectSlug || entry.projectId}/${entry.id}`}
              className="text-xs text-text3 hover:text-accent transition-colors ml-1"
            >
              View →
            </Link>
          )}
        </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="font-semibold text-xl text-text1 mb-2">Delete entry</h2>
            <p className="text-text2 text-sm mb-6">
              This can&apos;t be undone. Your build log entry will be gone forever.
            </p>
            <div className="mb-6">
              <label className="block text-xs text-text3 mb-2">
                Type{" "}
                <span className="text-red-400 font-semibold">DELETE</span>{" "}
                to confirm.
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full bg-surface2 border border-border2 text-text1 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-red-500 transition-colors"
                placeholder="DELETE"
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(""); }}
                className="px-4 py-2 text-sm text-text2 hover:text-text1 transition-colors"
              >
                Cancel
              </button>
              <button
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-xl border transition-colors",
                  deleteConfirmText === "DELETE"
                    ? "border-red-500 text-red-400 hover:bg-red-500/10"
                    : "border-border2 text-text3 cursor-not-allowed"
                )}
                disabled={deleteConfirmText !== "DELETE" || isDeleting}
                onClick={executeDelete}
              >
                {isDeleting ? "Deleting…" : "Delete entry"}
              </button>
            </div>
          </div>
        </div>
      )}

    </motion.div>
  );
}

