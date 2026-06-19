"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { 
  Home, Compass, BookOpen, HelpCircle, Star, TrendingUp, 
  LayoutDashboard, Bookmark, Bell, ChevronRight, Settings, 
  Plus, MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";

const STAGE_COLORS: Record<string, string> = {
  BUILDING:   "#7EB8F5",
  STRUGGLING: "#FF9800",
  LAUNCHED:   "#E8572A",
  PIVOTING:   "#C9A96E",
  PAUSED:     "#444444",
};

const DIVIDER = <div className="h-[1px] w-full bg-[#222222] my-[12px]" />;

export default function Sidebar() {
  const pathname = usePathname();
  const { user, profile, loading, signOut } = useAuth();
  
  // Mobile nav state (will be used in Step 9 but keeping the shell)
  
  if (loading) {
    return (
      <aside className="hidden md:flex flex-col fixed left-0 top-[48px] bottom-0 w-[240px] border-r border-[#222222] bg-[#111111] z-40 items-center justify-center gap-4">
        {/* Arcline monogram + wordmark */}
        <div className="flex flex-col items-center gap-3 select-none">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"
            style={{ animation: "arcPulse 2s ease-in-out infinite" }}>
            <path d="M16 2L2 30h7l7-14 7 14h7L16 2z" fill="#E8572A" />
            <path d="M10.5 22h11" stroke="#080808" strokeWidth="2" />
          </svg>
          <div style={{ animation: "arcPulse 2s ease-in-out infinite 0.3s" }}>
            <span className="font-mono text-[0.7rem] tracking-[0.25em] text-[#E8572A] uppercase">ARC</span>
            <span className="font-mono text-[0.7rem] tracking-[0.25em] text-[#888888] uppercase">LINE</span>
          </div>
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes arcPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
        `}} />
      </aside>
    );
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-[48px] bottom-0 w-[240px] border-r border-[#222222] bg-[#111111] py-[16px] px-[12px] z-40 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {user ? <LoggedInSidebar pathname={pathname} profile={profile} signOut={signOut} /> : <GuestSidebar pathname={pathname} />}
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="flex md:hidden fixed bottom-0 left-0 right-0 h-[56px] border-t border-[#222222] bg-[#111111]/95 backdrop-blur-md z-40 justify-around items-center px-4">
        {user ? (
          <MobileLoggedInNav pathname={pathname} profile={profile} />
        ) : (
          <MobileGuestNav pathname={pathname} />
        )}
      </nav>
    </>
  );
}

function MobileGuestNav({ pathname }: { pathname: string }) {
  const items = [
    { href: "/", label: "Home", icon: Home },
    { href: "/explore", label: "Explore", icon: Compass },
    { href: "/about", label: "Manifesto", icon: BookOpen },
    { href: "/login", label: "Sign in", icon: HelpCircle },
  ];

  return (
    <>
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-12 h-12 transition-colors",
              isActive ? "text-[#E8572A]" : "text-[#888888] hover:text-[#F2EDE4]"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-mono text-[8px] mt-1 uppercase">{item.label}</span>
          </Link>
        );
      })}
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MobileLoggedInNav({ pathname, profile }: { pathname: string; profile: any }) {
  const [hasUnread, setHasUnread] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!profile?.id) return;
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('is_read', false)
      .then(({ count }) => setHasUnread(Number(count) > 0));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const items = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/explore", label: "Explore", icon: Compass },
    { href: "/new-entry", label: "New", icon: Plus, highlight: true },
    { href: "/notifications", label: "Alerts", icon: Bell, badge: hasUnread },
    { href: profile?.username ? `/${profile.username}` : "/profile", label: "Builds", icon: LayoutDashboard },
  ];

  return (
    <>
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-12 h-12 transition-colors relative",
              item.highlight 
                ? "text-[#E8572A]" 
                : isActive 
                  ? "text-[#E8572A]" 
                  : "text-[#888888] hover:text-[#F2EDE4]"
            )}
          >
            <div className={cn(
              "relative p-1.5",
              item.highlight ? "bg-[#E8572A]/10 border border-[#E8572A]/30 rounded-none" : ""
            )}>
              <item.icon className="w-5 h-5" />
              {item.badge && <span className="absolute top-1 right-1 w-2 h-2 bg-[#E8572A] rounded-full" />}
            </div>
            <span className="font-mono text-[8px] mt-0.5 uppercase">{item.label}</span>
          </Link>
        );
      })}
    </>
  );
}

function GuestSidebar({ pathname }: { pathname: string }) {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");
  const [stats, setStats] = useState({ builders: 0, entries: 0 });

  useEffect(() => {
    fetch("/api/stats")
      .then(r => r.json())
      .then(json => setStats({ builders: json.builders ?? 0, entries: json.entries ?? 0 }))
      .catch(() => {});
  }, []);

  const DISCOVER_ITEMS = [
    { href: "/", label: "Home", icon: Home },
    { href: "/explore", label: "Explore", icon: Compass },
    { href: "/about", label: "Manifesto", icon: BookOpen },
    { href: "/how-it-works", label: "How It Works", icon: HelpCircle },
    { href: "/explore?tab=featured", label: "Featured Builds", icon: Star },
    { href: "/explore?tab=trending", label: "Trending", icon: TrendingUp },
  ];

  const RECENT_JOURNEYS = [
    { id: 1, title: "Finally nailed the landing page...", color: "#E8572A" },
    { id: 2, title: "Struggling with Supabase RLS", color: "#FF9800" },
    { id: 3, title: "First 100 users milestone reached", color: "#7EB8F5" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* TOP SECTION — BRAND PITCH */}
      <div className="bg-[#080808] border border-[#222222] p-[12px] px-[14px]">
        <div className="font-mono text-[0.56rem] text-[#E8572A] tracking-wide mb-1 uppercase">For Builders</div>
        <p className="font-body font-light text-[0.75rem] text-[#888888] leading-[1.6] mb-3">
          Document your honest journey. Failures included.
        </p>
        <Link href="/login" className="block w-full h-[34px] bg-[#E8572A] flex items-center justify-center font-body font-medium text-[0.75rem] text-white hover:bg-[#D14820] transition-colors">
          Get started free &rarr;
        </Link>
        <div className="mt-2 text-center">
          <Link href="/login" className="font-mono text-[0.6rem] text-[#555555] hover:text-[#888888] transition-colors">
            Sign in &rarr;
          </Link>
        </div>
      </div>

      {DIVIDER}

      {/* NAV SECTION */}
      <div>
        <div className="font-mono text-[0.56rem] text-[#555555] tracking-widest mb-2 px-[12px]">DISCOVER</div>
        <nav className="flex flex-col gap-0.5">
          {DISCOVER_ITEMS.map((item) => {
            let isActive = false;
            if (item.href === "/") {
              isActive = pathname === "/";
            } else if (item.href.includes("?tab=")) {
              const tabName = new URLSearchParams(item.href.split("?")[1]).get("tab");
              isActive = pathname === "/explore" && currentTab === tabName;
            } else if (item.href === "/explore") {
              isActive = pathname === "/explore" && (!currentTab || (currentTab !== "featured" && currentTab !== "trending"));
            } else {
              isActive = pathname.startsWith(item.href);
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-[12px] py-[8px] font-body text-[0.8rem] transition-colors",
                  isActive 
                    ? "bg-[#E8572A13] border-l-[2px] border-[#E8572A] text-[#E8572A]" 
                    : "text-[#888888] hover:bg-white/5 hover:text-[#F2EDE4] border-l-[2px] border-transparent"
                )}
              >
                <item.icon className="w-[16px] h-[16px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {DIVIDER}

      {/* RECENT JOURNEYS */}
      <div>
        <div className="font-mono text-[0.56rem] text-[#555555] tracking-widest mb-2 px-[12px]">RECENT JOURNEYS</div>
        <div className="flex flex-col gap-2 px-[12px]">
          {RECENT_JOURNEYS.map((item) => (
            <Link key={item.id} href="/explore" className="flex items-center gap-2 group">
              <span className="w-[4px] h-[4px] rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="font-body font-light text-[0.75rem] text-[#888888] truncate group-hover:text-[#F2EDE4] transition-colors">
                {item.title}
              </span>
            </Link>
          ))}
          <Link href="/explore" className="text-[#E8572A] text-[0.62rem] font-body mt-1 hover:underline">
            See all &rarr;
          </Link>
        </div>
      </div>

      {DIVIDER}

      {/* STATS SECTION */}
      <div className="px-[12px] flex flex-col gap-3">
        <div>
          <div className="font-mono text-[1.0rem] text-[#F2EDE4]">{stats.builders > 0 ? stats.builders.toLocaleString() : "—"}</div>
          <div className="font-mono text-[0.54rem] text-[#555555] uppercase">Builders</div>
        </div>
        <div>
          <div className="font-mono text-[1.0rem] text-[#F2EDE4]">{stats.entries > 0 ? stats.entries.toLocaleString() : "—"}</div>
          <div className="font-mono text-[0.54rem] text-[#555555] uppercase">Entries</div>
        </div>
      </div>

      <div className="mt-auto font-body font-light italic text-[0.7rem] text-[#444444] p-[12px]">
        Your journey is your portfolio.
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function NewEntryButton({ myProjects }: { myProjects: any[] }) {
  const router = useRouter();
  const hasProjects = myProjects.length > 0;

  function handleClick() {
    if (!hasProjects) {
      router.push("/new-build");
    } else {
      router.push("/new-entry");
    }
  }

  return (
    <div className="relative group">
      <button
        onClick={handleClick}
        className="w-full h-[38px] bg-[#E8572A] flex items-center justify-center font-body font-medium text-[0.82rem] text-white hover:bg-[#D14820] transition-colors"
        style={{ animation: "pulseShadow 3s infinite" }}
      >
        + New Entry
      </button>
      {!hasProjects && (
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-[#1A1A1A] border border-[#444] text-[#888] font-mono text-[0.55rem] px-2 py-1 whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
          Create a project first
        </div>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function LoggedInSidebar({ pathname, profile, signOut }: { pathname: string; profile: any; signOut: () => void }) {
  const [buildsOpen, setBuildsOpen] = useState(true);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('projects')
      .select('id, slug, title, stage, entries:entries(count)')
      .eq('user_id', profile.id)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(4)
      .then(({ data }) => setMyProjects(data ?? []));
      
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('is_read', false)
      .then(({ count }) => setHasUnreadNotifications(Number(count) > 0));

    if (profile.username) {
      fetch(`/api/profile/${profile.username}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.data?.profile) {
            setFollowerCount(data.data.profile.followers);
          }
        })
        .catch(console.error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const createdDate = profile?.created_at ? new Date(profile.created_at) : new Date();
  const timeDiff = Math.abs(new Date().getTime() - createdDate.getTime());
  const diffDays = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));

  const initials = profile?.name ? profile.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() : "?";
  const entryCount = profile?.entry_count || 0;
  const progressPercent = Math.min((entryCount / 100) * 100, 100);

  const MAIN_NAV = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/explore", label: "Explore", icon: Compass },
    { href: profile?.username ? `/${profile.username}` : "/profile", label: "My Builds", icon: LayoutDashboard },
    { href: "/messages", label: "Messages", icon: MessageSquare },
    { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
    { href: "/notifications", label: "Notifications", icon: Bell, badge: hasUnreadNotifications },
  ];

  const SECONDARY_NAV = [
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/how-it-works", label: "Help", icon: HelpCircle },
    { href: "/about", label: "About Arcline", icon: BookOpen },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* USER PROFILE MINI CARD */}
      <div className="bg-[#080808] border border-[#222222] p-[12px] mb-[12px]">
        <div className="flex items-center gap-3 mb-3">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="w-[32px] h-[32px] rounded-full object-cover" />
          ) : (
            <div className="w-[32px] h-[32px] rounded-full bg-[#E8572A] flex items-center justify-center font-body font-medium text-white text-[0.8rem]">
              {initials}
            </div>
          )}
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-body font-medium text-[0.82rem] text-[#F2EDE4] truncate">{profile?.name || "Builder"}</span>
            <span className="font-mono text-[0.6rem] text-[#555555] truncate">@{profile?.username || "username"}</span>
          </div>
        </div>
        <div className="mb-2">
          <div className="h-[4px] w-full bg-[#222222] mb-1">
            <div className="h-full bg-[#E8572A]" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="font-mono text-[0.55rem] text-[#555555]">Day {diffDays} &middot; {entryCount} entries</div>
        </div>
        <div className="flex gap-4 font-mono text-[0.6rem] text-[#888888]">
          <div><span className="text-[#F2EDE4]">{entryCount}</span> entries</div>
          <div><span className="text-[#F2EDE4]">{followerCount}</span> followers</div>
        </div>
      </div>

      {DIVIDER}

      {/* CTAS */}
      <div className="flex flex-col gap-[6px]">
        <NewEntryButton myProjects={myProjects} />
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes pulseShadow {
            0% { box-shadow: 0 0 0 0 rgba(232,87,42,0.35); }
            50% { box-shadow: 0 0 16px 0 rgba(232,87,42,0.35); }
            100% { box-shadow: 0 0 0 0 rgba(232,87,42,0); }
          }
        `}} />
        <Link href="/new-build" className="w-full h-[34px] border border-[#333333] flex items-center justify-center font-body font-medium text-[0.78rem] text-[#888888] hover:border-[#E8572A] hover:text-[#E8572A] transition-colors">
          + New Build
        </Link>
      </div>

      {DIVIDER}

      {/* MAIN NAV */}
      <div>
        <div className="font-mono text-[0.54rem] text-[#444444] tracking-widest mb-2 px-[12px]">NAVIGATE</div>
        <nav className="flex flex-col gap-0.5">
          {MAIN_NAV.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-[12px] py-[8px] font-body text-[0.8rem] transition-colors relative",
                  isActive 
                    ? "bg-[#E8572A13] border-l-[2px] border-[#E8572A] text-[#E8572A]" 
                    : "text-[#888888] hover:bg-white/5 hover:text-[#F2EDE4] border-l-[2px] border-transparent"
                )}
              >
                <div className="relative">
                  <item.icon className="w-[16px] h-[16px]" />
                  {item.badge && <span className="absolute -top-1 -right-1 w-[6px] h-[6px] bg-[#E8572A] rounded-full" />}
                </div>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {DIVIDER}

      {/* MY BUILDS */}
      <div>
        <button 
          onClick={() => setBuildsOpen(!buildsOpen)}
          className="w-full flex items-center justify-between px-[12px] mb-2 font-mono text-[0.54rem] text-[#444444] tracking-widest hover:text-[#888888] transition-colors"
        >
          <span>MY BUILDS</span>
          <ChevronRight className={cn("w-3 h-3 transition-transform", buildsOpen ? "rotate-90" : "")} />
        </button>
        {buildsOpen && (
          <div className="flex flex-col gap-0.5">
            {myProjects.map((p) => (
              <Link
                key={p.id}
                href={`/${profile?.username}/${p.slug}`}
                className="flex items-center justify-between px-[12px] py-[6px] group hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ backgroundColor: STAGE_COLORS[p.stage] || "#444" }} />
                  <span className="font-body text-[0.78rem] text-[#888888] group-hover:text-[#F2EDE4] truncate">{p.title}</span>
                </div>
                <span className="font-mono text-[0.56rem] text-[#555555] flex-shrink-0 ml-2">{p.entries[0]?.count || 0}</span>
              </Link>
            ))}
            <Link href="/new-build" className="px-[12px] py-[6px] font-body text-[0.7rem] text-[#555555] hover:text-[#E8572A] transition-colors mt-1">
              + New Build
            </Link>
          </div>
        )}
      </div>

      {DIVIDER}

      {/* SECONDARY NAV */}
      <div>
        <div className="font-mono text-[0.54rem] text-[#444444] tracking-widest mb-2 px-[12px]">MORE</div>
        <nav className="flex flex-col gap-0.5">
          {SECONDARY_NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-[12px] py-[6px] font-body text-[0.78rem] text-[#555555] hover:text-[#F2EDE4] transition-colors"
            >
              <item.icon className="w-[14px] h-[14px]" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* BOTTOM */}
      <div className="mt-auto px-[12px] pt-[12px]">
        <button onClick={signOut} className="flex items-center gap-2 group w-full">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="w-[24px] h-[24px] rounded-full object-cover" />
          ) : (
            <div className="w-[24px] h-[24px] rounded-full bg-[#E8572A] flex items-center justify-center font-body font-medium text-white text-[0.6rem]">
              {initials}
            </div>
          )}
          <span className="font-body text-[0.72rem] text-[#555555] group-hover:text-[#EF5350] transition-colors">Sign out</span>
        </button>
      </div>
    </div>
  );
}
