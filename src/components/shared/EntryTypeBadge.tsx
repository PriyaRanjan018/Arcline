import { cn } from "@/lib/utils";

type EntryType = "WIN" | "SETBACK" | "MILESTONE" | "REALIZATION";

export default function EntryTypeBadge({ type, className }: { type: EntryType; className?: string }) {
  const styles = {
    WIN: "text-win border-win",
    SETBACK: "text-setback border-setback bg-[rgba(255,152,0,0.05)]", // slightly stronger bg for setbacks
    MILESTONE: "text-milestone border-milestone",
    REALIZATION: "text-realization border-realization",
  };

  return (
    <span
      className={cn(
        "inline-block px-1.5 py-0.5 border rounded-none text-[10px] font-mono tracking-widest uppercase",
        styles[type],
        className
      )}
    >
      {type}
    </span>
  );
}
