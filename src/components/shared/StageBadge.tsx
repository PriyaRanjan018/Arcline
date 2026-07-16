import { cn } from "@/lib/utils";
import { ProjectStage } from "@/lib/enums";

const STAGE_LABELS: Record<ProjectStage, string> = {
  STARTED:      "Just Started",
  BUILDING:     "Building",
  STRUGGLING:   "Struggling",
  PIVOTING:     "Pivoting",
  BREAKTHROUGH: "Breakthrough",
  LAUNCHED:     "Launched",
  PAUSED:       "Paused",
  ABANDONED:    "Abandoned",
};

const STAGE_STYLES: Record<ProjectStage, string> = {
  STARTED:      "text-realization border-realization bg-[rgba(201,169,110,0.1)]",
  BUILDING:     "text-milestone border-milestone bg-[rgba(126,184,245,0.1)]",
  STRUGGLING:   "text-setback border-setback bg-[rgba(255,152,0,0.1)]",
  PIVOTING:     "text-realization border-realization bg-[rgba(201,169,110,0.1)]",
  BREAKTHROUGH: "text-win border-win bg-[rgba(76,175,80,0.1)]",
  LAUNCHED:     "text-accent border-accent bg-[rgba(232,87,42,0.1)]",
  PAUSED:       "text-text3 border-text3 bg-[rgba(85,85,85,0.1)]",
  ABANDONED:    "text-text3 border-border2 bg-[rgba(44,44,44,0.1)]",
};

export default function StageBadge({ stage, className }: { stage: string; className?: string }) {
  const safeStage = (stage as ProjectStage) in STAGE_STYLES ? (stage as ProjectStage) : "BUILDING";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 border rounded-none text-[10px] font-mono tracking-wider font-bold",
        STAGE_STYLES[safeStage],
        className
      )}
    >
      <div className="w-1.5 h-1.5 rounded-[50%] bg-current animate-pulse" />
      {STAGE_LABELS[safeStage]}
    </div>
  );
}
