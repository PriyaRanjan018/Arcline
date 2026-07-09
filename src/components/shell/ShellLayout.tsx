"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";
import CommandPalette from "./CommandPalette";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger if inside input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === "/") {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    }

    function handleCustomEvent() {
      setIsCommandPaletteOpen(true);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-command-palette", handleCustomEvent);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-palette", handleCustomEvent);
    };
  }, []);

  if (["/login", "/signup", "/onboarding"].includes(pathname)) {
    return <>{children}</>;
  }

  if (isLanding) {
    return (
      <div className="flex flex-col min-h-screen">
        <Topbar isLanding={true} />
        <main className="flex-1 mt-[48px]">{children}</main>
        <footer className="w-full py-8 text-center text-[#555555] italic">
          Proof of Work. NOT perfection.
        </footer>
        <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar isLanding={false} />
      <div className="flex flex-1 mt-[48px] pb-[56px] md:pb-0">
        {/* Mobile Sidebar Navigation will be handled inside Sidebar component (collapses to bottom) */}
        <Sidebar />
        <main className="flex-1 md:ml-[240px] w-full">{children}</main>
      </div>
      <footer className="w-full py-8 text-center text-[#555555] italic md:pl-[240px] pb-[76px] md:pb-8">
        Proof of Work. NOT perfection.
      </footer>
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
    </div>
  );
}
