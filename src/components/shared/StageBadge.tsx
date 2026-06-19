import { cn } from "@/lib/utils";

type Stage = "BUILDING" | "STRUGGLING" | "PIVOTING" | "LAUNCHED";

export default function StageBadge({ stage, className }: { stage: Stage; className?: string }) {
  const styles = {
    BUILDING: "text-milestone border-milestone bg-[rgba(126,184,245,0.1)]",
    STRUGGLING: "text-setback border-setback bg-[rgba(255,152,0,0.1)]",
    PIVOTING: "text-realization border-realization bg-[rgba(201,169,110,0.1)]",
    LAUNCHED: "text-win border-win bg-[rgba(76,175,80,0.1)]",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 border rounded-none text-[10px] font-mono tracking-wider font-bold",
        styles[stage],
        className
      )}
    >
      <div className="w-1.5 h-1.5 rounded-[50%] bg-current animate-pulse" />
      {stage}
    </div>
  );
}
