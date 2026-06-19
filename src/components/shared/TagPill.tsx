import { cn } from "@/lib/utils";

export default function TagPill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-1 bg-surface2 border border-border2 text-text2 text-[10px] font-mono uppercase tracking-wider rounded-[3px]",
        className
      )}
    >
      {children}
    </span>
  );
}
