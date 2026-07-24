"use client";

import { motion } from "framer-motion";

// ── Progress formula ────────────────────────────────────────────────────────
const STAGE_PROGRESS: Record<string, number | null> = {
  STARTED:      8,
  BUILDING:     30,
  STRUGGLING:   35,
  PIVOTING:     45,
  BREAKTHROUGH: 70,
  LAUNCHED:     90,
  PAUSED:       null,
  ABANDONED:    null,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function calcProgress(stage: string, entries: Array<{ type: string }>): number {
  const base = STAGE_PROGRESS[stage] ?? 30;
  const milestoneCount = Math.min(entries.filter(e => e.type === "MILESTONE").length, 3);
  const winCount       = Math.min(entries.filter(e => e.type === "WIN").length, 8);
  const bonus = (milestoneCount * 2) + (winCount * 0.5);

  // Special case: LAUNCHED + 3 milestones = 100%
  if (stage === "LAUNCHED" && milestoneCount >= 3) return 100;

  return Math.min(Math.round(base + bonus), 95);
}

// ── Ring stroke color ──────────────────────────────────────────────────────
function getRingColor(stage: string): string {
  if (stage === "PAUSED")     return "#444444";
  if (stage === "ABANDONED")  return "#2a2a2a";
  return "var(--accent)"; // #E8572A for all others
}

// ── Component ──────────────────────────────────────────────────────────────
interface ProgressRingProps {
  stage: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entries: Array<{ type: string }>;
  size?: number;
  strokeWidth?: number;
}

export default function ProgressRing({
  stage,
  entries,
  size = 112,
  strokeWidth = 6,
}: ProgressRingProps) {
  const percent      = calcProgress(stage, entries);
  const radius       = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const color        = getRingColor(stage);
  const cx           = size / 2;
  const cy           = size / 2;

  const isInactive = stage === "PAUSED" || stage === "ABANDONED";

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      {/* SVG ring — rotated so it starts at top */}
      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)" }}
      >
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />

        {/* Filled arc */}
        <motion.circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - percent / 100) }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ opacity: isInactive ? 0.4 : 1 }}
        />
      </svg>

      {/* Center label */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
        }}
      >
        <span
          className="font-mono font-bold"
          style={{
            fontSize: size < 80 ? 14 : 18,
            color: isInactive ? "var(--text3)" : "var(--text1)",
            lineHeight: 1,
          }}
        >
          {percent}%
        </span>
        <span
          className="font-mono"
          style={{
            fontSize: 8,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--text3)",
          }}
        >
          {isInactive ? stage.toLowerCase() : "progress"}
        </span>
      </div>
    </div>
  );
}
