"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageTransition from "@/components/shared/PageTransition";
import EntryCard from "@/components/shared/EntryCard";
import Avatar from "@/components/shared/Avatar";
import Button from "@/components/shared/Button";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Loader2 } from "lucide-react";

function timeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  if (seconds < 30) return "just now";
  return Math.floor(seconds) + "s ago";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEntryToCardShape(dbEntry: any) {
  return {
    id: dbEntry.id,
    projectId: dbEntry.project?.title ?? "",
    projectSlug: dbEntry.project?.slug || dbEntry.project?.id || "",
    builder: {
      username: dbEntry.author?.username ?? "",
      name:     dbEntry.author?.name ?? "Builder",
      initials: (dbEntry.author?.name ?? "??").substring(0, 2).toUpperCase(),
      avatarUrl: dbEntry.author?.avatar_url,
      avatarBg: "bg-surface2",
    },
    type:           dbEntry.type,
    title:          dbEntry.title,
    content:        dbEntry.body,
    dayNumber:      dbEntry.day_number,
    date:           new Date(dbEntry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    tags:           [],
    reactionCount:  dbEntry.reaction_count ?? 0,
    commentCount:   dbEntry.comment_count ?? 0,
    reactions:      { feel: 0, keepGoing: 0, hitMe: 0, beenHere: 0 },
  };
}

export default function EntryPage({
  params,
}: {
  params: { username: string; project: string; entryId: string };
}) {
  const router = useRouter();
  const { user } = useAuth();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [entry, setEntry] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchEntryAndComments() {
      setIsLoading(true);
      try {
        // Fetch Entry
        const entryRes = await fetch(`/api/journal/${params.entryId}`);
        if (!entryRes.ok) {
          setIsNotFound(true);
          return;
        }
        const entryData = await entryRes.json();
        setEntry(mapEntryToCardShape(entryData.data));

        // Fetch Comments
        const commentsRes = await fetch(`/api/journal/${params.entryId}/comments`);
        if (commentsRes.ok) {
          const commentsData = await commentsRes.json();
          setComments(commentsData.data || []);
        }
      } catch (error) {
        console.error(error);
        setIsNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEntryAndComments();
  }, [params.entryId]);

  const handlePostComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push(`/login?next=/${params.username}/${params.project}/${params.entryId}`);
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/journal/${params.entryId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newComment }),
      });

      if (res.ok) {
        const { data } = await res.json();
        // Optimistically add the new comment to the list
        setComments((prev) => [...prev, data]);
        setNewComment("");
      }
    } catch (error) {
      console.error("Failed to post comment", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-text3" />
      </div>
    );
  }

  if (isNotFound || !entry) {
    return (
      <PageTransition className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
        <h1 className="text-3xl font-display font-bold text-text1">Entry not found</h1>
        <p className="text-text2">This entry might have been deleted or doesn't exist.</p>
        <Button onClick={() => router.push(`/${params.username}/${params.project}`)}>
          Back to Project
        </Button>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="max-w-3xl mx-auto px-4 py-8 pb-32">
      <div className="mb-6">
        <Link
          href={`/${params.username}/${params.project}`}
          className="inline-flex items-center gap-2 text-text3 hover:text-text1 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {entry.projectId} log
        </Link>
      </div>

      <EntryCard entry={entry} variant="detail" />

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-text1 mb-6">Comments</h3>
        
        {/* Comment Input */}
        <div className="mb-8 p-4 bg-surface rounded-2xl border border-border">
          {user ? (
            <form onSubmit={handlePostComment} className="flex gap-4">
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Leave a comment..."
                  className="w-full bg-surface2 border border-border2 rounded-xl px-4 py-3 text-sm text-text1 placeholder:text-text3 focus:outline-none focus:border-text3 focus:ring-1 focus:ring-text3 resize-none h-20 transition-all"
                />
              </div>
              <div className="self-end">
                <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
                  {isSubmitting ? "Posting..." : "Post"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="text-center py-4 text-text2 text-sm">
              <Link href={`/login?next=/${params.username}/${params.project}/${params.entryId}`} className="text-accent hover:underline">
                Log in
              </Link>{" "}
              to leave a comment.
            </div>
          )}
        </div>

        {/* Comment List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-text3 text-sm border border-dashed border-border2 rounded-2xl">
              No comments yet. Be the first to reply!
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="p-4 bg-surface rounded-2xl border border-border flex gap-4">
                <Link href={`/${comment.author.username}`} className="flex-shrink-0 mt-1">
                  <Avatar
                    initials={comment.author.name.substring(0, 2).toUpperCase()}
                    src={comment.author.avatar_url}
                    bgColor="bg-surface2"
                    size="sm"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      href={`/${comment.author.username}`}
                      className="text-sm font-medium text-text1 hover:text-accent transition-colors"
                    >
                      {comment.author.name}
                    </Link>
                    <span className="text-xs text-text3">
                      {timeAgo(new Date(comment.created_at))}
                    </span>
                  </div>
                  <p className="text-sm text-text2 leading-relaxed whitespace-pre-wrap break-words">
                    {comment.body}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </PageTransition>
  );
}
