"use client";

import Link from "next/link";
import { Search, Bell, Plus, LogIn, User, Folder, Bookmark, Compass, BookOpen, Settings, HelpCircle, LogOut, Smile } from "lucide-react";
import ArclineLogo from "../shared/ArclineLogo";
import ArcloneMonogram from "../shared/ArcloneMonogram";
import Avatar from "../shared/Avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePathname } from "next/navigation";

export default function Topbar({ isLanding }: { isLanding?: boolean }) {
  const { user, profile, loading, signOut } = useAuth();
  const [hasUnread, setHasUnread] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const pathname = usePathname();
  const notifRef = useRef<HTMLDivElement>(null);

  // Close notifications on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) return;

    // 1. Initial check for unread notifications
    async function checkUnread() {
      try {
        const res = await fetch("/api/notifications?unread=true");
        if (res.ok) {
          const json = await res.json();
          setHasUnread(json.data && json.data.length > 0);
        }
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    }
    checkUnread();

    // 2. Subscribe to new notifications via Realtime
    const supabase = createClient();
    const channel = supabase
      .channel("realtime:notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("New notification:", payload);
          setHasUnread(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Derive initials from real name, fallback to "?" while loading
  const initials = profile?.name
    ? profile.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const profileHref = profile?.username ? `/${profile.username}` : "/dashboard";

  return (
    <header className="fixed top-0 left-0 right-0 h-[48px] z-50 bg-[rgba(17,17,17,0.92)] backdrop-blur-[12px] border-b border-border flex items-center px-4 md:px-6 justify-between">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <ArcloneMonogram size={26} />
          <div className="hidden md:block">
            <ArclineLogo size="md" />
          </div>
        </Link>
      </div>

      {!isLanding && (
        <div className="hidden md:flex flex-1 max-w-md mx-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text3" />
          <input
            type="text"
            placeholder="Search journeys, builders, entries..."
            onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
            onFocus={(e) => {
              e.target.blur(); // Prevents focus ring hanging on the readOnly input
              window.dispatchEvent(new CustomEvent("open-command-palette"));
            }}
            readOnly
            className="w-full bg-surface2 border border-border2 text-sm text-text1 rounded-none pl-9 pr-12 py-1.5 focus:outline-none focus:border-accent transition-colors cursor-pointer"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center border border-border2 px-1.5 py-0.5 rounded-none">
            <span className="text-[10px] text-text3 font-mono">/</span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        {loading ? (
          <div className="w-7 h-7 rounded-[50%] bg-surface2 animate-pulse" />
        ) : !user ? (
          // NOT LOGGED IN
          <div className="flex items-center gap-2">
            <Link 
              href="/login" 
              className="px-4 py-1.5 border border-[#333333] font-body text-[0.78rem] text-[#888888] hover:border-[#E8572A] hover:text-[#E8572A] transition-colors"
            >
              Sign in
            </Link>
            <Link 
              href="/login" 
              className="px-4 py-1.5 bg-[#E8572A] font-body text-[0.78rem] text-white hover:bg-[#D14820] transition-colors"
            >
              Get started
            </Link>
          </div>
        ) : (
          // LOGGED IN
          <div className="flex items-center gap-4">
            
            {/* Notifications Wrapper */}
            <div className="relative hidden sm:block" ref={notifRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-text2 hover:text-[#E8572A] transition-colors relative flex items-center justify-center w-8 h-8"
              >
                <Bell className="w-[18px] h-[18px]" />
                {hasUnread && pathname !== "/notifications" && (
                  <span className="absolute top-[4px] right-[4px] w-[6px] h-[6px] rounded-full bg-[#E8572A]" />
                )}
              </button>

              {/* NOTIFICATIONS DROPDOWN */}
              {showNotifications && (
                <div className="absolute right-0 top-[48px] w-[320px] bg-[#111111] border border-[#222222] shadow-xl z-50 flex flex-col">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#222222]">
                    <h3 className="font-display font-bold text-[1rem] text-[#F2EDE4]">Notifications</h3>
                    <button className="font-body text-[0.7rem] text-[#888888] hover:text-[#F2EDE4] transition-colors">
                      Mark all read
                    </button>
                  </div>
                  
                  <div className="flex flex-col max-h-[300px] overflow-y-auto custom-scrollbar">
                    {/* Example Unread */}
                    <div className="flex items-start gap-3 p-3 bg-[#E8572A08] border-l-[3px] border-[#E8572A]">
                      <div className="w-[24px] h-[24px] rounded-full bg-[#333333] flex items-center justify-center text-[0.6rem] font-body text-white flex-shrink-0">
                        MK
                      </div>
                      <div className="flex flex-col">
                        <p className="font-body font-light text-[0.8rem] text-[#F2EDE4] leading-tight">
                          Meera K. reacted 'I feel this' to your entry
                        </p>
                        <span className="font-mono text-[0.58rem] text-[#555555] mt-1">2m ago</span>
                      </div>
                    </div>
                    {/* Example Read */}
                    <div className="flex items-start gap-3 p-3 bg-[#111111] border-b border-[#222222]">
                      <div className="w-[24px] h-[24px] rounded-full bg-[#333333] flex items-center justify-center text-[0.6rem] font-body text-white flex-shrink-0">
                        AS
                      </div>
                      <div className="flex flex-col">
                        <p className="font-body font-light text-[0.8rem] text-[#888888] leading-tight">
                          Arjun S. started following your journey
                        </p>
                        <span className="font-mono text-[0.58rem] text-[#555555] mt-1">1h ago</span>
                      </div>
                    </div>
                    {/* Example Read 2 */}
                    <div className="flex items-start gap-3 p-3 bg-[#111111] border-b border-[#222222]">
                      <div className="w-[24px] h-[24px] rounded-full bg-[#333333] flex items-center justify-center text-[0.6rem] font-body text-white flex-shrink-0">
                        PR
                      </div>
                      <div className="flex flex-col">
                        <p className="font-body font-light text-[0.8rem] text-[#888888] leading-tight">
                          Priya R. commented on your build log
                        </p>
                        <span className="font-mono text-[0.58rem] text-[#555555] mt-1">3h ago</span>
                      </div>
                    </div>
                  </div>

                  <Link 
                    href="/notifications" 
                    onClick={() => setShowNotifications(false)}
                    className="w-full py-2 bg-[#080808] text-center font-body text-[0.75rem] text-[#E8572A] hover:bg-[#111] transition-colors"
                  >
                    See all notifications &rarr;
                  </Link>
                </div>
              )}
            </div>

            <Link href="/new-entry" className="text-text2 hover:text-[#E8572A] transition-colors hidden sm:block">
              <Plus className="w-[18px] h-[18px]" />
            </Link>
            
            <div className="w-[1px] h-[20px] bg-[#222222] hidden sm:block" />
            
            {/* User Dropdown wrapper (Hover) */}
            <div className="relative group cursor-pointer hidden sm:block pb-[10px] pt-[10px]">
              <div className="block">
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt={profile.name}
                    className="w-[28px] h-[28px] rounded-full object-cover border border-[#222222]"
                  />
                ) : (
                  <div className="w-[28px] h-[28px] rounded-full bg-[#E8572A] flex items-center justify-center font-body font-medium text-white text-[0.7rem]">
                    {initials}
                  </div>
                )}
              </div>

              {/* USER DROPDOWN (appears on hover) */}
              <div className="absolute right-0 top-[38px] w-[240px] bg-[#0c0c0c] border border-border shadow-xl z-50 flex flex-col opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                {/* Header (Signed in identity) */}
                <div className="px-4 py-3 border-b border-[#222222] flex flex-col text-left">
                  <span className="text-[10px] text-text3 font-mono">Signed in as</span>
                  <span className="font-body font-semibold text-xs text-text1 truncate mt-0.5">{profile?.name || "Builder"}</span>
                  <span className="font-mono text-[10px] text-text3 truncate">@{profile?.username || "username"}</span>
                </div>

                {/* Status Indicator Button */}
                <div className="px-4 py-2 border-b border-[#222222] text-left">
                  <button 
                    onClick={() => {
                      window.location.href = "/settings";
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 bg-[#141414] border border-border2 hover:border-accent/40 text-[11px] text-text2 hover:text-text1 transition-all rounded-none text-left"
                  >
                    <Smile className="w-3.5 h-3.5 text-accent" />
                    <span className="truncate">Set status...</span>
                  </button>
                </div>

                {/* Main Action Links */}
                <div className="flex flex-col py-1.5 border-b border-[#222222]">
                  <Link href={profileHref} className="px-4 py-1.5 font-body text-xs text-[#888888] hover:text-[#F2EDE4] hover:bg-white/5 transition-all flex items-center gap-2.5">
                    <User className="w-3.5 h-3.5 text-text3" />
                    <span>Your profile</span>
                  </Link>
                  <Link href={`${profileHref}?tab=builds`} className="px-4 py-1.5 font-body text-xs text-[#888888] hover:text-[#F2EDE4] hover:bg-white/5 transition-all flex items-center gap-2.5">
                    <Folder className="w-3.5 h-3.5 text-text3" />
                    <span>Your builds</span>
                  </Link>
                  <Link href="/bookmarks" className="px-4 py-1.5 font-body text-xs text-[#888888] hover:text-[#F2EDE4] hover:bg-white/5 transition-all flex items-center gap-2.5">
                    <Bookmark className="w-3.5 h-3.5 text-text3" />
                    <span>Your bookmarks</span>
                  </Link>
                </div>

                {/* Discovery and Knowledge Links */}
                <div className="flex flex-col py-1.5 border-b border-[#222222]">
                  <Link href="/explore" className="px-4 py-1.5 font-body text-xs text-[#888888] hover:text-[#F2EDE4] hover:bg-white/5 transition-all flex items-center gap-2.5">
                    <Compass className="w-3.5 h-3.5 text-text3" />
                    <span>Explore</span>
                  </Link>
                  <Link href="/how-it-works" className="px-4 py-1.5 font-body text-xs text-[#888888] hover:text-[#F2EDE4] hover:bg-white/5 transition-all flex items-center gap-2.5">
                    <BookOpen className="w-3.5 h-3.5 text-text3" />
                    <span>How it works</span>
                  </Link>
                </div>

                {/* Settings & Support Links */}
                <div className="flex flex-col py-1.5 border-b border-[#222222]">
                  <Link href="/settings" className="px-4 py-1.5 font-body text-xs text-[#888888] hover:text-[#F2EDE4] hover:bg-white/5 transition-all flex items-center gap-2.5">
                    <Settings className="w-3.5 h-3.5 text-text3" />
                    <span>Settings</span>
                  </Link>
                  <Link href="/help" className="px-4 py-1.5 font-body text-xs text-[#888888] hover:text-[#F2EDE4] hover:bg-white/5 transition-all flex items-center gap-2.5">
                    <HelpCircle className="w-3.5 h-3.5 text-text3" />
                    <span>Help & Feedback</span>
                  </Link>
                </div>

                {/* Log Out */}
                <div className="py-1.5">
                  <button 
                    onClick={() => {
                      signOut().then(() => window.location.href = "/");
                    }}
                    className="w-full px-4 py-1.5 font-body text-xs text-[#EF5350] hover:bg-red-500/10 hover:text-red-400 transition-all flex items-center gap-2.5 text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
