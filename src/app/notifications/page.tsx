"use client";

import PageTransition from "@/components/shared/PageTransition";
import { Bell, UserPlus, MessageSquare, Flame, AtSign, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function NotifIcon({ type }: { type: string }) {
  const cls = "w-4 h-4";
  if (type === "follow")   return <UserPlus    className={cls} />;
  if (type === "comment")  return <MessageSquare className={cls} />;
  if (type === "reaction") return <Flame        className={cls} />;
  if (type === "mention")  return <AtSign       className={cls} />;
  if (type === "system")   return <Settings     className={cls} />;
  return <Bell className={cls} />;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildMessage(notif: any): { text: string; href?: string } {
  const actor = notif.actor;
  const actorName = actor?.name || actor?.username || "Someone";
  const actorUsername = actor?.username;
  const actorHref = actorUsername ? `/${actorUsername}` : undefined;

  switch (notif.type) {
    case "follow":
      return { text: `${actorName} started following you`, href: actorHref };
    case "reaction":
      return { text: `${actorName} reacted to your entry`, href: actorHref };
    case "comment":
      return { text: `${actorName} commented on your entry`, href: actorHref };
    case "mention":
      return { text: `${actorName} mentioned you`, href: actorHref };
    default:
      return { text: notif.message || "You have a new notification" };
  }
}

function timeAgo(dateString: string) {
  const date = new Date(dateString);
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
  return Math.floor(seconds) + "s ago";
}

export default function NotificationsPage() {
  const { user } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifications() {
      if (!user) return;
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const json = await res.json();
          setNotifications(json.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchNotifications();
  }, [user]);

  async function handleMarkAllRead() {
    if (!user) return;
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [] })
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  }

  const unread = notifications.filter(n => !n.is_read).length;

  return (
    <PageTransition className="p-4 md:p-8 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-display font-bold">Notifications</h1>
          {unread > 0 && (
            <span className="text-xs font-mono bg-accent text-white px-2 py-0.5">
              {unread} new
            </span>
          )}
        </div>
        <button 
          onClick={handleMarkAllRead}
          className="text-xs font-mono text-text3 hover:text-text1 transition-colors"
        >
          Mark all read
        </button>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <div className="border border-dashed border-border2 p-16 text-center animate-pulse">
            <p className="text-text3 font-mono text-sm">Loading...</p>
          </div>
        ) : notifications.map(notif => (
          <div
            key={notif.id}
            className={`flex items-start gap-4 p-4 border transition-colors cursor-default ${
              notif.is_read
                ? "border-border bg-surface hover:bg-surface2"
                : "border-[#2a1a10] bg-[#110b06] hover:bg-[#160d07]"
            }`}
          >
            {/* Icon circle */}
            <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-[50%] mt-0.5 ${
              notif.is_read ? "bg-surface2 text-text3" : "bg-accent/20 text-accent"
            }`}>
              <NotifIcon type={notif.type} />
            </div>

            <div className="flex-1 min-w-0">
              {(() => {
                const { text, href } = buildMessage(notif);
                return (
                  <p className={`text-sm leading-relaxed ${
                    notif.is_read ? "text-text2" : "text-text1 font-medium"
                  }`}>
                    {href ? (
                      <Link href={href} className="hover:text-accent transition-colors underline underline-offset-2">
                        {notif.actor?.name || notif.actor?.username || "Someone"}
                      </Link>
                    ) : null}
                    {href ? " " + text.replace(notif.actor?.name || notif.actor?.username || "Someone", "").trimStart() : text}
                  </p>
                );
              })()}
              <span className="text-[10px] font-mono text-text3 mt-1 block">{timeAgo(notif.created_at)}</span>
            </div>

            {!notif.is_read && (
              <div className="w-1.5 h-1.5 rounded-[50%] bg-accent flex-shrink-0 mt-2" />
            )}
          </div>
        ))}
      </div>

      {!isLoading && notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Bell className="w-10 h-10 text-border2" />
          <p className="text-text3 font-mono text-sm">No notifications yet.</p>
        </div>
      )}
    </PageTransition>
  );
}
