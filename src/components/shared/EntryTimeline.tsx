"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function EntryTimeline({ entries }: { entries: any[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastNodeRef = useRef<HTMLDivElement>(null);

  const typeColors: Record<string, string> = {
    WIN:         "var(--win)",
    SETBACK:     "var(--setback)",
    MILESTONE:   "var(--milestone)",
    REALIZATION: "var(--realization)",
  };

  const typeLabelColors: Record<string, string> = {
    WIN:         "text-win border-win/30 bg-win/5",
    SETBACK:     "text-setback border-setback/30 bg-setback/5",
    MILESTONE:   "text-milestone border-milestone/30 bg-milestone/5",
    REALIZATION: "text-realization border-realization/30 bg-realization/5",
  };

  // Sort entries chronologically (oldest → newest left to right)
  const sortedEntries = [...entries].reverse();

  // ── Sizing: grow only when entries overflow the viewport ───────────────────
  const CARD_W       = 200;      // card width
  const MIN_SPACING  = 260;      // min px per entry (card + gap)
  const PADDING_X    = 60;       // left/right padding
  const HEIGHT       = 420;      // reduced from 720 → fits without empty space

  // Width: only as wide as needed. If few entries → fits in view → no scroll
  const numEntries   = Math.max(sortedEntries.length, 1);
  const contentW     = numEntries * MIN_SPACING + PADDING_X * 2;
  // We use `min-content` behavior: if contentW < container, container wins
  const svgW         = contentW;
  const svgH         = HEIGHT;

  const momentumMap: Record<string, number> = {
    WIN:         120,
    MILESTONE:   190,
    REALIZATION: 270,
    SETBACK:     340,
  };

  const points = sortedEntries.map((entry, i) => {
    const segmentW = numEntries === 1
      ? svgW / 2
      : PADDING_X + (i / (numEntries - 1)) * (svgW - PADDING_X * 2);
    return {
      x: numEntries === 1 ? svgW / 2 : segmentW,
      y: momentumMap[entry.type] ?? svgH / 2,
      type: entry.type,
      title: entry.title,
      content: entry.content || entry.body,
      date: entry.date || new Date(entry.created_at).toLocaleDateString(),
      raw: entry,
    };
  });

  const createCurvedPath = (pts: typeof points) => {
    if (pts.length === 0) return "";
    if (pts.length === 1) return `M${pts[0].x},${pts[0].y}`;
    let path = `M${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const cur = pts[i], nxt = pts[i + 1];
      const cp1x = cur.x + (nxt.x - cur.x) * 0.5;
      const cp2x = cur.x + (nxt.x - cur.x) * 0.5;
      path += ` C${cp1x},${cur.y} ${cp2x},${nxt.y} ${nxt.x},${nxt.y}`;
    }
    return path;
  };

  const pathD = createCurvedPath(points);

  // ── Auto-scroll to the most recent (last) entry on mount ──────────────────
  useEffect(() => {
    if (!scrollRef.current || sortedEntries.length === 0) return;
    // Use a short delay so the DOM has fully painted
    const id = setTimeout(() => {
      if (lastNodeRef.current && scrollRef.current) {
        // Scroll the last node's card into view, centred
        const container = scrollRef.current;
        const lastX = points[points.length - 1]?.x ?? 0;
        const targetScroll = lastX - container.clientWidth * 0.65;
        container.scrollTo({ left: Math.max(0, targetScroll), behavior: "smooth" });
      }
    }, 350);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedEntries.length]);

  // ── Empty state ────────────────────────────────────────────────────────────
  if (sortedEntries.length === 0) {
    return (
      <div className="bg-surface border border-border p-12 text-center">
        <p className="text-text3 font-mono text-sm">No entries yet. Log your first step to start the journey map.</p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="bg-surface border border-border relative select-none"
      style={{ overflowX: svgW > 900 ? "auto" : "hidden", overflowY: "hidden" }}
    >
      {/* Inner canvas — only as wide as needed */}
      <div style={{ width: svgW, height: svgH, position: "relative", minWidth: "100%" }}>

        {/* Subtle grid background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(to right,rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,0.025) 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Y-axis lane labels */}
        {[
          { y: momentumMap.WIN,         label: "Wins",          color: typeColors.WIN },
          { y: momentumMap.MILESTONE,   label: "Milestones",    color: typeColors.MILESTONE },
          { y: momentumMap.REALIZATION, label: "Realizations",  color: typeColors.REALIZATION },
          { y: momentumMap.SETBACK,     label: "Setbacks",      color: typeColors.SETBACK },
        ].map(({ y, label, color }) => (
          <div
            key={label}
            className="absolute pointer-events-none flex items-center gap-1.5"
            style={{ top: y - 8, left: 8, opacity: 0.35 }}
          >
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 9, fontFamily: "var(--font-body)", color, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {label}
            </span>
          </div>
        ))}

        {/* SVG Track */}
        <svg className="absolute inset-0 pointer-events-none" width={svgW} height={svgH}>
          {/* Mountain at final node */}
          {points.length > 0 && (
            <g transform={`translate(${points[points.length - 1].x - 40}, ${points[points.length - 1].y - 60})`} opacity={0.15}>
              <path d="M 40 0 L 80 80 L 0 80 Z" fill="none" stroke="var(--border-2)" strokeWidth="1" />
              <path d="M 40 0 L 55 30 L 25 30 Z" fill="none" stroke="var(--border-2)" strokeWidth="0.5" />
              <line x1="40" y1="0" x2="40" y2="-14" stroke="var(--border-2)" strokeWidth="1" />
              <polygon points="40,-14 54,-8 40,-3" fill="var(--border-2)" />
            </g>
          )}

          {/* Road track */}
          {pathD && (
            <>
              <path d={pathD} fill="none" stroke="var(--surface2)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" opacity={0.3} />
              <path d={pathD} fill="none" stroke="var(--border-2)" strokeWidth="1.5" strokeDasharray="5,8" strokeLinecap="round" />
            </>
          )}

          {/* Animated accent line */}
          {pathD && (
            <motion.path
              d={pathD} fill="none" stroke="var(--accent)" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          )}

          {/* Nodes */}
          {points.map((p, i) => {
            const isHovered = hoveredIndex === i;
            const isEven = i % 2 === 0;
            const lineOffset = isEven ? -38 : 38;
            return (
              <g key={i}>
                <line
                  x1={p.x} y1={p.y} x2={p.x} y2={p.y + lineOffset}
                  stroke={isHovered ? "var(--accent)" : "var(--border-2)"}
                  strokeWidth={isHovered ? "1.2" : "0.6"}
                  strokeDasharray="2,3"
                  className="transition-colors duration-200"
                />
                <AnimatePresence>
                  {isHovered && (
                    <motion.circle
                      cx={p.x} cy={p.y} r="12"
                      fill="none" stroke="var(--accent)" strokeWidth="1"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1.3, opacity: [0, 0.4, 0] }}
                      exit={{ opacity: 0 }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                    />
                  )}
                </AnimatePresence>
                <circle cx={p.x} cy={p.y} r="5" fill="var(--bg)" stroke={typeColors[p.type]} strokeWidth="2.5" />
                <circle cx={p.x} cy={p.y} r="2" fill={typeColors[p.type]} />
              </g>
            );
          })}
        </svg>

        {/* HTML Cards Layer */}
        <div className="absolute inset-0 pointer-events-none">
          {points.map((p, i) => {
            const isHovered = hoveredIndex === i;
            const isEven = i % 2 === 0;
            const isLast = i === points.length - 1;
            // Cards alternate above/below the track
            const cardTop = isEven ? p.y - 38 - 160 : p.y + 38;

            return (
              <motion.div
                key={i}
                ref={isLast ? lastNodeRef : undefined}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={cn(
                  "absolute pointer-events-auto bg-bg/95 border transition-all duration-300",
                  isHovered
                    ? "border-accent shadow-[0_8px_30px_rgba(232,87,42,0.15)] -translate-y-1"
                    : "border-border shadow-md"
                )}
                style={{
                  width: CARD_W,
                  left: p.x - CARD_W / 2,
                  top: cardTop,
                }}
                initial={{ opacity: 0, scale: 0.95, y: isEven ? -8 : 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.12 * i, duration: 0.35, ease: "easeOut" }}
              >
                <div className="h-0.5 w-full" style={{ backgroundColor: typeColors[p.type] }} />
                <div className="p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-text3 uppercase tracking-wider">
                      Step {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className={cn("text-[9px] font-mono px-2 py-0.5 border uppercase tracking-wider", typeLabelColors[p.type])}>
                      {p.type}
                    </span>
                  </div>
                  <h3 className="text-xs font-display font-bold text-text1 line-clamp-2 leading-tight">
                    {p.title}
                  </h3>
                  <p className="text-[11px] text-text2 line-clamp-2 leading-relaxed font-body font-light">
                    {p.content}
                  </p>
                  <div className="flex items-center gap-1.5 pt-1.5 border-t border-border/50">
                    <Calendar className="w-3 h-3 text-text3" />
                    <span className="text-[10px] font-mono text-text3">{p.date}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
