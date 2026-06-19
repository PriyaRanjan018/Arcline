"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Home, Compass, Plus, Settings, HelpCircle, BookOpen, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  category: "Navigation" | "Actions" | "Resources" | "Builders";
}

export default function CommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const [userResults, setUserResults] = useState<CommandItem[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
      setUserResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || search.length < 2) {
      setUserResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingUsers(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("username, name")
        .or(`username.ilike.%${search}%,name.ilike.%${search}%`)
        .limit(5);

      if (data && !error) {
        const results: CommandItem[] = data.map((profile) => ({
          id: `user-${profile.username}`,
          title: profile.name || profile.username,
          subtitle: `@${profile.username}`,
          icon: User,
          category: "Builders",
          action: () => {
            router.push(`/${profile.username}`);
            onClose();
          },
        }));
        setUserResults(results);
      }
      setIsSearchingUsers(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, isOpen, router, onClose, supabase]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const commands: CommandItem[] = [
    {
      id: "dashboard",
      title: "Go to Dashboard",
      subtitle: "View your personal builder feed",
      icon: Home,
      category: "Navigation",
      action: () => {
        router.push(user ? "/dashboard" : "/");
        onClose();
      },
    },
    {
      id: "explore",
      title: "Explore Journeys",
      subtitle: "Discover what other builders are working on",
      icon: Compass,
      category: "Navigation",
      action: () => {
        router.push("/explore");
        onClose();
      },
    },
    {
      id: "new-entry",
      title: "Log New Entry",
      subtitle: "Share a win, setback, or milestone",
      icon: Plus,
      category: "Actions",
      action: () => {
        router.push(user ? "/new-entry" : "/login?next=/new-entry");
        onClose();
      },
    },
    {
      id: "new-build",
      title: "Create New Build",
      subtitle: "Start a new project thread",
      icon: Sparkles,
      category: "Actions",
      action: () => {
        router.push(user ? "/new-build" : "/login?next=/new-build");
        onClose();
      },
    },
    ...(user && profile ? [
      {
        id: "profile",
        title: "View My Profile",
        subtitle: `Go to arcline.dev/${profile.username}`,
        icon: User,
        category: "Navigation" as const,
        action: () => {
          router.push(`/${profile.username}`);
          onClose();
        },
      },
      {
        id: "settings",
        title: "Account Settings",
        subtitle: "Manage your profile and API keys",
        icon: Settings,
        category: "Navigation" as const,
        action: () => {
          router.push("/settings");
          onClose();
        },
      }
    ] : []),
    {
      id: "manifesto",
      title: "Manifesto",
      subtitle: "Read the philosophy behind Arcline",
      icon: BookOpen,
      category: "Resources" as const,
      action: () => {
        router.push("/about");
        onClose();
      },
    },
    {
      id: "help",
      title: "How It Works",
      subtitle: "Learn how to use proof-of-work",
      icon: HelpCircle,
      category: "Resources" as const,
      action: () => {
        router.push("/how-it-works");
        onClose();
      },
    },
  ];

  const filteredCommands = [...commands, ...userResults].filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.subtitle?.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase()) ||
    c.category === "Builders" // Always show builder results if they were fetched for this query
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  // Group commands by category
  const categories = Array.from(new Set(filteredCommands.map((c) => c.category)));

  let flatIndex = 0;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          onClose();
        }
      }}
    >
      <div 
        ref={containerRef}
        className="w-full max-w-[540px] bg-[#111111] border border-[#222222] shadow-2xl flex flex-col overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div className="relative flex items-center h-12 border-b border-[#222222] px-4">
          <Search className={cn("w-4 h-4 mr-3 flex-shrink-0 transition-colors", isSearchingUsers ? "text-accent animate-pulse" : "text-[#555555]")} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full h-full bg-transparent text-[#F2EDE4] font-body text-[0.9rem] focus:outline-none placeholder-[#444444]"
          />
          <kbd className="font-mono text-[10px] text-[#555555] border border-[#222222] px-1.5 py-0.5 ml-2">ESC</kbd>
        </div>

        {/* Commands List */}
        <div className="max-h-[340px] overflow-y-auto custom-scrollbar p-2">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-[#555555] font-body text-[0.8rem]">
              No commands found matching "{search}"
            </div>
          ) : (
            categories.map((category) => {
              const categoryCommands = filteredCommands.filter((c) => c.category === category);
              return (
                <div key={category} className="mb-2">
                  <div className="font-mono text-[0.56rem] text-[#555555] tracking-widest px-3 py-1 uppercase">
                    {category}
                  </div>
                  <div className="flex flex-col gap-0.5 mt-1">
                    {categoryCommands.map((command) => {
                      const currentFlatIndex = flatIndex++;
                      const isSelected = currentFlatIndex === selectedIndex;
                      return (
                        <button
                          key={command.id}
                          onClick={command.action}
                          onMouseEnter={() => setSelectedIndex(currentFlatIndex)}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 text-left font-body transition-colors border-l-[2px]",
                            isSelected 
                              ? "bg-[#E8572A13] border-l-[#E8572A] text-[#E8572A]" 
                              : "border-l-transparent text-[#888888] hover:bg-white/5 hover:text-[#F2EDE4]"
                          )}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <command.icon className="w-4 h-4 flex-shrink-0" />
                            <div className="flex flex-col overflow-hidden">
                              <span className="text-[0.8rem] font-medium leading-tight truncate">{command.title}</span>
                              {command.subtitle && (
                                <span className={cn(
                                  "text-[0.68rem] font-light leading-normal truncate",
                                  isSelected ? "text-[#E8572A]/70" : "text-[#555555]"
                                )}>
                                  {command.subtitle}
                                </span>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <span className="font-mono text-[9px] text-[#E8572A] tracking-wider uppercase flex-shrink-0">
                              ENTER
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-[#222222] bg-[#080808] font-mono text-[9px] text-[#555555]">
          <div className="flex items-center gap-4">
            <span>↑↓ to navigate</span>
            <span>ENTER to select</span>
          </div>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
}
