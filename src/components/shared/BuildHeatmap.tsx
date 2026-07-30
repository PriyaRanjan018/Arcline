"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Entry {
  created_at: string;
  type?: string;
}

interface BuildHeatmapProps {
  entries: Entry[];
  /** The year the builder joined — can be a plain year number (e.g. 2025) or an ISO date string */
  builderSince?: string | number;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function toLocalKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function formatDate(d: Date): string {
  const day = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d.getDay()];
  return `${day}, ${MONTH_FULL[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// ── Main Heatmap (Arcline Pulse) ──────────────────────────────────────────────
export default function BuildHeatmap({ entries, builderSince }: BuildHeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800); // Fallback width

  useEffect(() => {
    const obs = new ResizeObserver(([e]) => setContainerWidth(e.contentRect.width));
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Year sidebar logic
  const joinYear = useMemo(() => {
    const currentYear = new Date().getFullYear();
    if (typeof builderSince === "number" && builderSince > 1990 && builderSince <= currentYear) return builderSince;
    if (typeof builderSince === "string") {
      const asNum = Number(builderSince);
      if (!isNaN(asNum) && asNum > 1990 && asNum <= currentYear) return asNum;
      const parsed = new Date(builderSince).getFullYear();
      if (!isNaN(parsed) && parsed > 1990 && parsed <= currentYear) return parsed;
    }
    if (entries.length > 0) {
      const years = entries.map(e => new Date(e.created_at).getFullYear()).filter(y => !isNaN(y) && y > 1990);
      if (years.length > 0) return Math.min(...years);
    }
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

  // ── Build the data points ───────────────────────────────────────────────────
  const { dataPoints, maxCount, totalEntries, monthStarts } = useMemo(() => {
    const isCurrentYear = selectedYear === currentYear;
    const jan1 = new Date(selectedYear, 0, 1);
    
    const endPlotDate = isCurrentYear ? new Date() : new Date(selectedYear, 11, 31);
    endPlotDate.setHours(23, 59, 59, 999);

    const points = [];
    let cursor = new Date(jan1);
    let highest = 0;
    const mStarts: { month: string; index: number }[] = [];
    let currentMonth = -1;
    
    while (cursor <= endPlotDate) {
      const key = toLocalKey(cursor);
      const count = countMap[key] || 0;
      if (count > highest) highest = count;
      
      if (cursor.getMonth() !== currentMonth) {
        currentMonth = cursor.getMonth();
        // Record the index where a new month starts
        mStarts.push({ month: MONTHS[currentMonth], index: points.length });
      }

      points.push({
        date: new Date(cursor),
        key,
        count
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    const tEntries = Object.entries(countMap)
      .filter(([k]) => k.startsWith(`${selectedYear}-`))
      .reduce((a, [, v]) => a + v, 0);

    return { 
      dataPoints: points, 
      maxCount: Math.max(1, highest), 
      totalEntries: tEntries,
      monthStarts: mStarts 
    };
  }, [countMap, selectedYear, currentYear]);

  // ── Calculate SVG dimensions and paths ───────────────────────────────────────
  const SIDEBAR_W = 42;
  const chartHeight = 140;
  // Make sure we have a valid width
  const chartWidth = Math.max(10, containerWidth - SIDEBAR_W - 16); 

  // We map the array index to X coordinate, and count to Y coordinate.
  // The baseline (Y = chartHeight) represents 0 entries.
  // The peak (Y = 10) represents maxCount entries.
  const chartPaddingTop = 15;
  
  const pathData = useMemo(() => {
    if (dataPoints.length === 0) return "";
    
    const dx = chartWidth / Math.max(1, (dataPoints.length - 1));
    const dy = (chartHeight - chartPaddingTop) / maxCount;
    
    const commands = dataPoints.map((pt, i) => {
      const x = i * dx;
      const y = chartHeight - (pt.count * dy);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
    });
    
    return commands.join(" ");
  }, [dataPoints, chartWidth, chartHeight, maxCount]);

  // Area path for gradient fill
  const areaPath = useMemo(() => {
    if (!pathData) return "";
    return `${pathData} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`;
  }, [pathData, chartWidth, chartHeight]);

  // ── Scrubber Interactivity ───────────────────────────────────────────────────
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const dx = chartWidth / Math.max(1, (dataPoints.length - 1));
    
    // Find closest index
    let idx = Math.round(x / dx);
    if (idx < 0) idx = 0;
    if (idx >= dataPoints.length) idx = dataPoints.length - 1;
    
    setHoverIdx(idx);
  }, [chartWidth, dataPoints.length]);

  const handleMouseLeave = useCallback(() => {
    setHoverIdx(null);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>

      {/* Top row: summary */}
      <div className="flex items-center justify-between">
        <div className="text-text2 font-body text-xs font-medium">
          {totalEntries} {totalEntries === 1 ? "entry" : "entries"} in {selectedYear}
        </div>
      </div>

      <div ref={containerRef} style={{ display: "flex", gap: 16, width: "100%", position: "relative" }}>
        
        {/* Main Chart Area */}
        <div style={{ flex: 1, minWidth: 0, position: "relative", height: chartHeight + 30 }}>
          
          <svg 
            width={chartWidth} 
            height={chartHeight + 30} 
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ cursor: "crosshair", overflow: "visible" }}
          >
            <defs>
              <linearGradient id="arclineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E8572A" stopOpacity="0.4" />
                <stop offset="80%" stopColor="#E8572A" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#E8572A" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Baseline Grid & Month Labels */}
            <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#222222" strokeWidth="1" />
            
            {monthStarts.map((m) => {
              const dx = chartWidth / Math.max(1, (dataPoints.length - 1));
              const x = m.index * dx;
              return (
                <g key={m.month}>
                  <line x1={x} y1={chartHeight} x2={x} y2={chartHeight + 5} stroke="#444444" strokeWidth="1" />
                  <text x={x + 4} y={chartHeight + 20} fill="var(--text2)" fontSize="11" fontFamily="var(--font-body)">
                    {m.month}
                  </text>
                </g>
              );
            })}

            {/* Render the area fill */}
            <path d={areaPath} fill="url(#arclineGradient)" />
            
            {/* Render the line */}
            <path d={pathData} fill="none" stroke="#E8572A" strokeWidth="1.5" strokeLinejoin="round" />

            {/* Render Scrubber Line & Dot if hovered */}
            {hoverIdx !== null && (
              <g>
                {(() => {
                  const pt = dataPoints[hoverIdx];
                  const dx = chartWidth / Math.max(1, (dataPoints.length - 1));
                  const dy = (chartHeight - chartPaddingTop) / maxCount;
                  const x = hoverIdx * dx;
                  const y = chartHeight - (pt.count * dy);
                  return (
                    <>
                      {/* Vertical laser line */}
                      <line x1={x} y1={0} x2={x} y2={chartHeight} stroke="#E8572A" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
                      
                      {/* Glowing dot on the line */}
                      <circle cx={x} cy={y} r={4} fill="#E8572A" />
                      <circle cx={x} cy={y} r={12} fill="#E8572A" opacity="0.2" />
                    </>
                  );
                })()}
              </g>
            )}
          </svg>

          {/* Render Tooltip (HTML overlay) */}
          <AnimatePresence>
            {hoverIdx !== null && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, duration: 0.1 }}
                style={{
                  position: "absolute",
                  left: (hoverIdx * (chartWidth / Math.max(1, (dataPoints.length - 1)))) + 10,
                  top: -40,
                  background: "#0d1117",
                  border: "1px solid rgba(255,255,255,0.12)",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontFamily: "var(--font-body)",
                  color: "#e6edf3",
                  pointerEvents: "none",
                  whiteSpace: "nowrap",
                  zIndex: 200,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                }}
              >
                <span style={{ fontWeight: 700, color: dataPoints[hoverIdx].count > 0 ? "#E8572A" : "#e6edf3" }}>
                  {dataPoints[hoverIdx].count === 0 ? "No entries" : `${dataPoints[hoverIdx].count} ${dataPoints[hoverIdx].count === 1 ? "entry" : "entries"}`}
                </span>
                <span style={{ color: "rgba(230,237,243,0.55)", marginLeft: 4 }}>
                  on {formatDate(dataPoints[hoverIdx].date)}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Year sidebar */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          flexShrink: 0,
          width: SIDEBAR_W,
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
    </div>
  );
}
