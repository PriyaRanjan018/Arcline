import { cn } from "@/lib/utils";

type EntryType = "WIN" | "SETBACK" | "MILESTONE" | "REALIZATION";

const LABEL: Record<EntryType, string> = {
  WIN:         "Win",
  SETBACK:     "Setback",
  MILESTONE:   "Milestone",
  REALIZATION: "Realization",
};

const STYLES: Record<EntryType, string> = {
  WIN:         "text-win  border-win/40  bg-[rgba(76,175,80,0.07)]",
  SETBACK:     "text-setback border-setback/40 bg-[rgba(255,152,0,0.07)]",
  MILESTONE:   "text-milestone border-milestone/40 bg-[rgba(126,184,245,0.07)]",
  REALIZATION: "text-realization border-realization/40 bg-[rgba(201,169,110,0.07)]",
};

export default function EntryTypeBadge({ type, className }: { type: EntryType; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block px-2 py-0.5 border rounded-md text-xs font-medium",
        STYLES[type],
        className
      )}
    >
      {LABEL[type]}
    </span>
  );
}
