"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ────────────────────────────────────────────────────────────────────
interface BadgeDef {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  category: "type_specific" | "stage" | "time";
}

interface EarnedBadge extends BadgeDef {
  earned: boolean;
}

// ── Badge definitions ────────────────────────────────────────────────────────
const BADGE_DEFINITIONS: Record<string, BadgeDef> = {
  // Type-specific
  first_log:           { id: "first_log",           label: "First Log",         description: "Logged your very first entry.",                      icon: "📝", color: "#7EB8F5", category: "type_specific" },
  five_entries:        { id: "five_entries",         label: "Proof of Work",     description: "5 entries logged on this project.",                  icon: "⚡", color: "#7EB8F5", category: "type_specific" },
  twenty_five_entries: { id: "twenty_five_entries",  label: "Consistent Builder",description: "25 entries logged — you show up.",                  icon: "🔩", color: "#7EB8F5", category: "type_specific" },
  survived_3_setbacks: { id: "survived_3_setbacks",  label: "Scar Tissue",       description: "Logged 3+ setbacks and kept building.",              icon: "🩹", color: "#FF9800", category: "type_specific" },
  rebound:             { id: "rebound",              label: "The Rebound",       description: "Logged a WIN after 2+ consecutive SETBACKs.",        icon: "↩️", color: "#4CAF50", category: "type_specific" },
  five_wins:           { id: "five_wins",            label: "On A Roll",         description: "5+ WIN entries — momentum is real.",                 icon: "🔥", color: "#E8572A", category: "type_specific" },
  deep_thinker:        { id: "deep_thinker",         label: "Deep Thinker",      description: "5+ REALIZATION entries — you reflect to grow.",      icon: "🧠", color: "#C9A96E", category: "type_specific" },
  milestone_5:         { id: "milestone_5",          label: "Checkpoint Racer",  description: "5 MILESTONE entries — major checkpoints logged.",    icon: "🏁", color: "#7EB8F5", category: "type_specific" },
  // Stage
  launched:            { id: "launched",             label: "Shipped",           description: "You launched something into the world.",             icon: "🚀", color: "#E8572A", category: "stage" },
  breakthrough:        { id: "breakthrough",         label: "Breakthrough",      description: "Hit a major breakthrough on this build.",            icon: "💡", color: "#FFD700", category: "stage" },
  survived_struggle:   { id: "survived_struggle",    label: "Iron Will",         description: "Was struggling — kept going anyway.",                icon: "⚔️", color: "#FF9800", category: "stage" },
  pivoted:             { id: "pivoted",              label: "Pivot King",        description: "Changed direction without giving up.",               icon: "🔄", color: "#C9A96E", category: "stage" },
  // Time
  week_one:            { id: "week_one",             label: "Week One",          description: "Project is 7+ days old.",                           icon: "🌱", color: "#4CAF50", category: "time" },
  month_one:           { id: "month_one",            label: "One Month Deep",    description: "Project is 30+ days old.",                          icon: "📅", color: "#4CAF50", category: "time" },
  three_months:        { id: "three_months",         label: "Quarter Builder",   description: "Project is 90+ days old.",                          icon: "🏛️", color: "#7EB8F5", category: "time" },
  six_months:          { id: "six_months",           label: "Half Year",         description: "Project is 180+ days old — rare commitment.",       icon: "⏳", color: "#C9A96E", category: "time" },
  one_year:            { id: "one_year",             label: "Year One",          description: "365 days building this. Extraordinary.",            icon: "💎", color: "#FFD700", category: "time" },
};

// ── Rebound check ────────────────────────────────────────────────────────────
function checkRebound(entries: Array<{ type: string }>): boolean {
  // Chronological order (oldest first)
  let consecutiveSetbacks = 0;
  for (const entry of entries) {
    if (entry.type === "SETBACK") {
      consecutiveSetbacks++;
    } else if (entry.type === "WIN") {
      if (consecutiveSetbacks >= 2) return true;
      consecutiveSetbacks = 0;
    } else {
      consecutiveSetbacks = 0;
    }
  }
  return false;
}

// ── Badge computation ────────────────────────────────────────────────────────
function computeBadges(
  project: { created_at: string; stage: string },
  entries: Array<{ type: string; created_at: string }>
): EarnedBadge[] {
  const ageInDays  = Math.floor((Date.now() - new Date(project.created_at).getTime()) / 86400000);
  const setbacks   = entries.filter(e => e.type === "SETBACK");
  const wins       = entries.filter(e => e.type === "WIN");
  const milestones = entries.filter(e => e.type === "MILESTONE");
  const realizations = entries.filter(e => e.type === "REALIZATION");

  // Sort entries oldest-first for rebound check
  const chronoEntries = [...entries].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const hasRebound = checkRebound(chronoEntries);

  const survivedStruggle =
    project.stage !== "STRUGGLING" &&
    project.stage !== "PAUSED" &&
    project.stage !== "ABANDONED" &&
    entries.some(e => e.type === "SETBACK");

  const earned: Array<{ id: string; earned: boolean }> = [
    { id: "first_log",           earned: entries.length >= 1 },
    { id: "five_entries",        earned: entries.length >= 5 },
    { id: "twenty_five_entries", earned: entries.length >= 25 },
    { id: "survived_3_setbacks", earned: setbacks.length >= 3 },
    { id: "rebound",             earned: hasRebound },
    { id: "five_wins",           earned: wins.length >= 5 },
    { id: "deep_thinker",        earned: realizations.length >= 5 },
    { id: "milestone_5",         earned: milestones.length >= 5 },
    { id: "launched",            earned: project.stage === "LAUNCHED" },
    { id: "breakthrough",        earned: ["BREAKTHROUGH", "LAUNCHED"].includes(project.stage) },
    { id: "survived_struggle",   earned: survivedStruggle },
    { id: "pivoted",             earned: ["PIVOTING", "BREAKTHROUGH", "LAUNCHED"].includes(project.stage) },
    { id: "week_one",            earned: ageInDays >= 7 },
    { id: "month_one",           earned: ageInDays >= 30 },
    { id: "three_months",        earned: ageInDays >= 90 },
    { id: "six_months",          earned: ageInDays >= 180 },
    { id: "one_year",            earned: ageInDays >= 365 },
  ];

  return earned.map(b => ({ ...BADGE_DEFINITIONS[b.id], earned: b.earned }));
}

// ── Category label ────────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  type_specific: "Entry Type",
  stage:         "Stage",
  time:          "Time",
};

// ── Badge tile ────────────────────────────────────────────────────────────────
function BadgeTile({ badge, compact }: { badge: EarnedBadge; compact?: boolean }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const size = compact ? 44 : 60;
  const iconSize = compact ? 18 : 26;

  return (
    <div style={{ position: "relative" }}>
      <motion.div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        whileHover={{ scale: 1.08 }}
        transition={{ duration: 0.15 }}
        style={{
          width:  size,
          height: size,
          background: badge.earned ? `${badge.color}14` : "var(--surface)",
          border: `1px solid ${badge.earned ? badge.color : "var(--border)"}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
          cursor: "default",
          flexShrink: 0,
          filter: badge.earned ? "none" : "grayscale(100%)",
          opacity: badge.earned ? 1 : 0.22,
          boxShadow: badge.earned ? `0 0 12px ${badge.color}40` : "none",
          transition: "box-shadow 0.2s",
        }}
      >
        <span style={{ fontSize: iconSize, lineHeight: 1 }}>{badge.icon}</span>
        {!compact && (
          <span
            className="font-mono"
            style={{
              fontSize: 7,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: badge.earned ? badge.color : "var(--text3)",
              textAlign: "center",
              lineHeight: 1.2,
              maxWidth: size - 8,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {badge.label}
          </span>
        )}
      </motion.div>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              bottom: "calc(100% + 8px)",
              left: "50%",
              transform: "translateX(-50%)",
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              padding: "6px 10px",
              zIndex: 50,
              whiteSpace: "nowrap",
              pointerEvents: "none",
              minWidth: 160,
              textAlign: "center",
            }}
          >
            <div
              className="font-mono"
              style={{ fontSize: 10, color: badge.earned ? badge.color : "var(--text3)", fontWeight: 700, marginBottom: 2 }}
            >
              {badge.label}
            </div>
            <div
              className="font-body"
              style={{ fontSize: 10, color: "var(--text2)", lineHeight: 1.4 }}
            >
              {badge.description}
            </div>
            {!badge.earned && (
              <div
                className="font-mono"
                style={{ fontSize: 9, color: "var(--text3)", marginTop: 4 }}
              >
                NOT YET EARNED
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface BadgeCollectionProps {
  project: { created_at: string; stage: string };
  entries: Array<{ type: string; created_at: string }>;
  compact?: boolean;
}

export default function BadgeCollection({ project, entries, compact }: BadgeCollectionProps) {
  const badges = useMemo(() => computeBadges(project, entries), [project, entries]);

  const earnedCount = badges.filter(b => b.earned).length;
  const lockedCount = badges.length - earnedCount;

  const categories: Array<"type_specific" | "stage" | "time"> = ["type_specific", "stage", "time"];

  if (compact) {
    // Just show earned badges as tiny row
    const earned = badges.filter(b => b.earned).slice(0, 5);
    return (
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {earned.map(b => (
          <BadgeTile key={b.id} badge={b} compact />
        ))}
        {earnedCount > 5 && (
          <span className="font-mono" style={{ fontSize: 9, color: "var(--text3)" }}>
            +{earnedCount - 5}
          </span>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          className="font-mono"
          style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text3)" }}
        >
          Badges
        </span>
        <span
          className="font-mono"
          style={{ fontSize: 9, color: "var(--accent)", background: "rgba(232,87,42,0.1)", border: "1px solid rgba(232,87,42,0.3)", padding: "2px 6px" }}
        >
          {earnedCount} earned
        </span>
        <span
          className="font-mono"
          style={{ fontSize: 9, color: "var(--text3)", background: "var(--surface)", border: "1px solid var(--border)", padding: "2px 6px" }}
        >
          {lockedCount} locked
        </span>
      </div>

      {/* Grouped rows */}
      {categories.map(cat => {
        const catBadges = badges.filter(b => b.category === cat);
        return (
          <div key={cat}>
            {/* Category label */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span
                className="font-mono"
                style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--text3)" }}
              >
                {CATEGORY_LABELS[cat]}
              </span>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>

            {/* Badge tiles */}
            <div
              style={{
                display: "flex",
                gap: 8,
                overflowX: "auto",
                scrollbarWidth: "none",
                paddingBottom: 4,
              }}
            >
              {catBadges.map(b => (
                <BadgeTile key={b.id} badge={b} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
