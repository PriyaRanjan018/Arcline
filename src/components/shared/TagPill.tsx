import { cn } from "@/lib/utils";

export default function TagPill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full",
        "border border-border2 bg-surface2",
        "text-[11px] text-text2",
        className
      )}
    >
      {children}
    </span>
  );
}
