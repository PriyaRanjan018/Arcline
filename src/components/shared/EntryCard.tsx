"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Trash2 } from "lucide-react";
import { animations } from "@/lib/animations";
import { cn } from "@/lib/utils";
import Avatar from "./Avatar";
import EntryTypeBadge from "./EntryTypeBadge";
import ReactionBar from "./ReactionBar";

interface EntryCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entry: any;
  variant?: "standard" | "spotlight" | "feed";
  className?: string;
  onDelete?: (id: string) => void;
}

export default function EntryCard({ entry, className, onDelete }: EntryCardProps) {
  const { profile } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const isOwner = profile?.username === entry.builder.username;

  const typeColors = {
    WIN: "var(--win)",
    SETBACK: "var(--setback)",
    MILESTONE: "var(--milestone)",
    REALIZATION: "var(--realization)",
  };

  const borderColor = typeColors[entry.type as keyof typeof typeColors];

  const executeDelete = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/entries/${entry.id}`, { method: 'DELETE' });
      if (res.ok) {
        if (onDelete) {
          onDelete(entry.id);
        } else {
          window.location.reload();
        }
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
      whileHover={{ y: -2, borderColor: 'var(--border-2)' }}
      viewport={{ once: true, margin: "-50px" }}
      className={cn(
        "bg-surface border border-border p-5 rounded-none flex flex-col gap-4 relative",
        "border-l-[3px]",
        className
      )}
      style={{ borderLeftColor: borderColor }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={`/${entry.builder.username}`}>
            <Avatar initials={entry.builder.initials} src={entry.builder.avatarUrl || entry.builder.avatar_url} bgColor={entry.builder.avatarBg} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Link href={`/${entry.builder.username}`} className="font-body font-medium text-sm hover:text-accent transition-colors">
                {entry.builder.name}
              </Link>
              <span className="text-text3 text-xs font-mono">•</span>
              <span className="text-text3 text-xs font-mono">{entry.date}</span>
            </div>
            <Link href={`/${entry.builder.username}/${entry.projectId}`} className="text-xs text-text2 hover:text-text1">
              Building <span className="underline decoration-border2 underline-offset-2">{entry.projectId}</span>
            </Link>
          </div>
        </div>
        <EntryTypeBadge type={entry.type} />
      </div>

      {/* Content */}
      <div>
        <h3 className="text-xl font-display font-bold mb-2 text-text1">{entry.title}</h3>
        <p className="text-text2 text-sm leading-relaxed">{entry.content}</p>
      </div>

      {/* Footer */}
      <div className="mt-2 pt-4 border-t border-border flex items-center justify-between">
        <ReactionBar 
          entryId={entry.id}
          initialCounts={{
            FEEL_THIS: entry.reactions?.feel || entry.reaction_count || 0,
            KEEP_GOING: entry.reactions?.keepGoing || 0,
            HIT_ME: entry.reactions?.hitMe || 0,
            BEEN_HERE: entry.reactions?.beenHere || 0,
          }}
          initialUserReactions={[]} // Would come from DB if populated
        />
        {isOwner && (
          <button 
            onClick={() => setShowDeleteModal(true)} 
            disabled={isDeleting}
            className="text-text3 hover:text-red-500 transition-colors p-2 rounded-sm disabled:opacity-50"
            title="Delete Entry"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border w-full max-w-md p-6 shadow-2xl relative">
            <h2 className="font-display font-bold text-2xl text-text1 mb-2">Delete Entry</h2>
            <p className="text-text2 text-sm mb-6">
              This action cannot be undone. This will permanently delete your log entry.
            </p>
            <div className="mb-6">
              <label className="block text-xs font-mono uppercase tracking-widest text-text3 mb-2">
                Please type <span className="text-red-500 font-bold">DELETE</span> to confirm.
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full bg-bg border border-border2 text-text1 px-4 py-2 font-mono text-sm focus:outline-none focus:border-red-500 transition-colors"
                placeholder="DELETE"
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(""); }}
                className="px-4 py-2 font-body text-sm font-medium hover:text-text1 text-text2 transition-colors"
              >
                Cancel
              </button>
              <button 
                className={cn(
                  "px-4 py-2 font-body text-sm font-medium border transition-colors",
                  deleteConfirmText === "DELETE"
                    ? "bg-transparent border-red-500 text-red-500 hover:bg-red-500/10"
                    : "bg-transparent border-red-900/30 text-red-500/40 cursor-not-allowed"
                )}
                disabled={deleteConfirmText !== "DELETE" || isDeleting}
                onClick={executeDelete}
              >
                {isDeleting ? "Deleting..." : "Delete entry"}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
