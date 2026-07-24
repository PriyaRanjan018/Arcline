"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";

interface Entry {
  created_at: string;
  type?: string;
}

interface BuildHeatmapProps {
  entries: Entry[];
  /** The year the builder joined — can be a plain year number (e.g. 2025) or an ISO date string */
  builderSince?: string | number;
}

// ── Colour scale ──────────────────────────────────────────────────────────────
const LEVEL_COLORS: Record<number, string> = {
  0: "#161b22",
  1: "rgba(232,87,42,0.20)",
  2: "rgba(232,87,42,0.44)",
  3: "rgba(232,87,42,0.70)",
  4: "#E8572A",
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_VISIBLE: Record<number, string> = { 1: "Mon", 3: "Wed", 5: "Fri" };


// ── Helpers ───────────────────────────────────────────────────────────────────
function toLocalKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function formatDate(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m-1, d);
  const day = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dt.getDay()];
  return `${day}, ${MONTH_FULL[m-1]} ${d}, ${y}`;
}


// ── Main Heatmap ──────────────────────────────────────────────────────────────
export default function BuildHeatmap({ entries, builderSince }: BuildHeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const obs = new ResizeObserver(([e]) => setContainerWidth(e.contentRect.width));
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Year sidebar
  const joinYear = useMemo(() => {
    const currentYear = new Date().getFullYear();

    // 1. If builderSince is already a plain year number (e.g. 2025)
    if (typeof builderSince === "number" && builderSince > 1990 && builderSince <= currentYear) {
      return builderSince;
    }

    // 2. If builderSince is a string — try parsing as a year or ISO date
    if (typeof builderSince === "string") {
      const asNum = Number(builderSince);
      if (!isNaN(asNum) && asNum > 1990 && asNum <= currentYear) return asNum;
      const parsed = new Date(builderSince).getFullYear();
      if (!isNaN(parsed) && parsed > 1990 && parsed <= currentYear) return parsed;
    }

    // 3. Fallback: earliest year found in entries
    if (entries.length > 0) {
      const years = entries
        .map(e => new Date(e.created_at).getFullYear())
        .filter(y => !isNaN(y) && y > 1990);
      if (years.length > 0) return Math.min(...years);
    }

    // 4. Last resort: current year (sidebar shows just this year)
    return currentYear;
  }, [builderSince, entries]);

  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const ys: number[] = [];
    for (let y = currentYear; y >= joinYear; y--) ys.push(y);
    return ys;
  }, [joinYear, currentYear]);

  const [selectedYear, setSelectedYear] = useState(currentYear);

  // ── date → count map ─────────────────────────────────────────────────────────
  const countMap = useMemo(() => {
    const map: Record<string, number> = {};
    entries.forEach((e) => {
      if (!e.created_at) return;
      const d = new Date(e.created_at);
      if (isNaN(d.getTime())) return;
      const key = toLocalKey(d);
      map[key] = (map[key] ?? 0) + 1;
    });
    return map;
  }, [entries]);


  const maxCount = useMemo(() => Math.max(1, ...Object.values(countMap)), [countMap]);
  function levelFor(count: number): number {
    if (count === 0) return 0;
    if (maxCount === 1) return 4;
    const r = count / maxCount;
    if (r <= 0.25) return 1;
    if (r <= 0.5)  return 2;
    if (r <= 0.75) return 3;
    return 4;
  }

  // ── Build the full-year grid ─────────────────────────────────────────────────
  const { grid, monthLabels, todayKey, totalEntries } = useMemo(() => {
    const isCurrentYear = selectedYear === currentYear;

    // Start = Jan 1 of selected year, snapped back to Sunday
    const jan1 = new Date(selectedYear, 0, 1);
    const startSunday = new Date(jan1);
    startSunday.setDate(jan1.getDate() - jan1.getDay());

    // End = Dec 31 of selected year (or today if current year)
    const endDate = isCurrentYear
      ? new Date()
      : new Date(selectedYear, 11, 31);
    endDate.setHours(23, 59, 59, 999);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = toLocalKey(today);

    const gridCols: Array<Array<{
      key: string; count: number; level: number; isToday: boolean; inFuture: boolean; isEmpty: boolean;
    }>> = [];
    const labels: Array<{ label: string; colIndex: number }> = [];
    let lastMonth = -1;
    let col: typeof gridCols[0] = [];
    let colIndex = 0;

    const cursor = new Date(startSunday);
    while (cursor <= endDate || col.length > 0) {
      const inRange = cursor.getFullYear() === selectedYear || cursor < jan1;
      const key = toLocalKey(cursor);
      const inFuture = cursor > today;
      const isEmpty = cursor < jan1 || cursor.getFullYear() > selectedYear;
      const count = (inRange && !isEmpty && !inFuture) ? (countMap[key] ?? 0) : 0;
      const level = isEmpty || inFuture ? 0 : levelFor(count);

      const month = cursor.getMonth();
      if (!isEmpty && month !== lastMonth && cursor.getDay() === 0) {
        lastMonth = month;
        labels.push({ label: MONTHS[month], colIndex });
      }

      col.push({ key, count, level, isToday: key === todayKey, inFuture, isEmpty });

      if (col.length === 7) {
        gridCols.push(col);
        col = [];
        colIndex++;
      }

      cursor.setDate(cursor.getDate() + 1);

      // Safety: stop after 54 columns
      if (colIndex > 53 && col.length === 0) break;
    }
    if (col.length > 0) {
      while (col.length < 7) col.push({ key: "", count: 0, level: 0, isToday: false, inFuture: false, isEmpty: true });
      gridCols.push(col);
    }

    const totalEntries = Object.entries(countMap)
      .filter(([k]) => k.startsWith(`${selectedYear}-`))
      .reduce((a, [, v]) => a + v, 0);

    return { grid: gridCols, monthLabels: labels, todayKey, totalEntries };
  }, [countMap, selectedYear, currentYear]);

  // ── Cell sizing: auto-fit to container ───────────────────────────────────────
  const DAY_LABEL_W = 28;
  const YEAR_COL_W = 42;
  const GAP = 2;
  const numCols = grid.length || 53;
  const availableW = containerWidth - DAY_LABEL_W - YEAR_COL_W - 24; // 24px padding
  const CELL = availableW > 0 ? Math.max(10, Math.floor((availableW - GAP * (numCols - 1)) / numCols)) : 13;

  // ── Tooltip ───────────────────────────────────────────────────────────────────
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number; count: number } | null>(null);

  const showTip = useCallback((e: React.MouseEvent, key: string, count: number, isEmpty: boolean) => {
    if (isEmpty || !key) return;
    setTooltip({ text: formatDate(key), x: e.clientX, y: e.clientY, count });
  }, []);
  const moveTip = useCallback((e: React.MouseEvent) => {
    setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null);
  }, []);
  const hideTip = useCallback(() => setTooltip(null), []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%" }}>

      {/* ── Tooltip ── */}
      {tooltip && (
        <div style={{
          position: "fixed",
          left: tooltip.x + 14,
          top: tooltip.y - 44,
          background: "#0d1117",
          border: "1px solid rgba(255,255,255,0.12)",
          padding: "7px 12px",
          fontSize: 12,
          fontFamily: "var(--font-body)",
          color: "#e6edf3",
          pointerEvents: "none",
          zIndex: 200,
          whiteSpace: "nowrap",
          boxShadow: "0 8px 24px rgba(0,0,0,0.7)",
          borderRadius: 6,
        }}>
          <span style={{ fontWeight: 700, color: tooltip.count > 0 ? "#E8572A" : "#e6edf3" }}>
            {tooltip.count === 0 ? "No entries" : `${tooltip.count} ${tooltip.count === 1 ? "entry" : "entries"}`}
          </span>
          <span style={{ color: "rgba(230,237,243,0.55)", marginLeft: 4 }}>on {tooltip.text}</span>
        </div>
      )}

      {/* ── Top row: summary ── */}
      <div style={{ fontSize: 12, fontFamily: "var(--font-body)", color: "var(--text2)", fontWeight: 500 }}>
        {totalEntries} {totalEntries === 1 ? "entry" : "entries"} in {selectedYear}
      </div>

      {/* ── Grid row: day labels + heatmap + year sidebar ── */}
      <div ref={containerRef} style={{ display: "flex", gap: 8, width: "100%" }}>

        {/* Day-of-week labels */}
        <div style={{
          display: "grid",
          gridTemplateRows: `repeat(7, ${CELL}px)`,
          gap: GAP,
          paddingTop: 20,
          flexShrink: 0,
          width: DAY_LABEL_W,
        }}>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d, i) => (
            <div key={i} style={{
              fontSize: 9,
              fontFamily: "var(--font-body)",
              color: "var(--text3)",
              display: "flex",
              alignItems: "center",
              height: CELL,
              opacity: DAYS_VISIBLE[i] ? 1 : 0,
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* Month labels + week columns */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Month label row */}
          <div style={{ display: "flex", gap: GAP, marginBottom: 4, height: 16 }}>
            {grid.map((_, cIdx) => {
              const lbl = monthLabels.find(m => m.colIndex === cIdx);
              return (
                <div key={cIdx} style={{
                  width: CELL,
                  flexShrink: 0,
                  fontSize: 9,
                  fontFamily: "var(--font-body)",
                  color: "var(--text3)",
                  overflow: "visible",
                  whiteSpace: "nowrap",
                  userSelect: "none",
                }}>
                  {lbl?.label ?? ""}
                </div>
              );
            })}
          </div>

          {/* Week columns */}
          <div style={{ display: "flex", gap: GAP }}>
            {grid.map((col, cIdx) => (
              <div key={cIdx} style={{ display: "flex", flexDirection: "column", gap: GAP }}>
                {col.map((day, dIdx) => (
                  <div
                    key={day.key || `${cIdx}-${dIdx}`}
                    onMouseEnter={e => showTip(e, day.key, day.count, day.isEmpty)}
                    onMouseMove={moveTip}
                    onMouseLeave={hideTip}
                    style={{
                      width: CELL,
                      height: CELL,
                      flexShrink: 0,
                      borderRadius: 3,
                      background: day.isEmpty
                        ? "transparent"
                        : LEVEL_COLORS[day.level],
                      border: day.isToday
                        ? "1.5px solid #E8572A"
                        : day.isEmpty
                        ? "none"
                        : day.level === 0
                        ? "1px solid rgba(255,255,255,0.04)"
                        : "1px solid rgba(0,0,0,0.2)",
                      cursor: day.isEmpty ? "default" : "pointer",
                      transition: "transform 0.1s, filter 0.1s",
                      boxShadow: day.level > 0
                        ? `0 0 ${day.level * 3}px rgba(232,87,42,${day.level * 0.1})`
                        : "none",
                    }}
                    onMouseOver={e => {
                      if (!day.isEmpty) {
                        (e.currentTarget as HTMLDivElement).style.transform = "scale(1.4)";
                        (e.currentTarget as HTMLDivElement).style.filter = "brightness(1.35)";
                      }
                    }}
                    onMouseOut={e => {
                      (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
                      (e.currentTarget as HTMLDivElement).style.filter = "brightness(1)";
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Year sidebar */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          flexShrink: 0,
          width: YEAR_COL_W,
          paddingTop: 20,
          alignItems: "flex-end",
        }}>
          {years.map(y => (
            <button
              key={y}
              onClick={() => setSelectedYear(y)}
              style={{
                fontSize: 11,
                fontFamily: "var(--font-body)",
                color: selectedYear === y ? "#E8572A" : "var(--text3)",
                fontWeight: selectedYear === y ? 700 : 400,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "1px 4px",
                borderRadius: 3,
                lineHeight: "1.4",
                textDecoration: selectedYear === y ? "underline" : "none",
                textDecorationColor: "#E8572A",
                textUnderlineOffset: 3,
                transition: "color 0.15s",
              }}
              onMouseOver={e => { if (selectedYear !== y) (e.currentTarget as HTMLButtonElement).style.color = "var(--text1)"; }}
              onMouseOut={e => { if (selectedYear !== y) (e.currentTarget as HTMLButtonElement).style.color = "var(--text3)"; }}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* ── Legend row ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 8,
        paddingLeft: DAY_LABEL_W + 8,
        paddingRight: YEAR_COL_W + 8,
      }}>
        <span style={{ fontSize: 11, fontFamily: "var(--font-body)", color: "var(--text3)" }}>
          Less
        </span>
        <div style={{ display: "flex", gap: 3 }}>
          {[0,1,2,3,4].map(lvl => (
            <div key={lvl} style={{
              width: 13,
              height: 13,
              borderRadius: 3,
              background: LEVEL_COLORS[lvl],
              border: "1px solid rgba(255,255,255,0.05)",
            }} />
          ))}
        </div>
        <span style={{ fontSize: 11, fontFamily: "var(--font-body)", color: "var(--text3)" }}>
          More
        </span>
      </div>
    </div>
  );
}
