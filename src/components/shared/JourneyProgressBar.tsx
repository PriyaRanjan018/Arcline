"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface JourneyProgressBarProps {
  progress: number;
  segments?: { type: "WIN" | "SETBACK" | "MILESTONE" | "REALIZATION"; position: number; title?: string; date?: string; }[];
  className?: string;
}

export default function JourneyProgressBar({ progress, segments = [], className }: JourneyProgressBarProps) {
  const typeColors = {
    WIN: "#4CAF50",
    SETBACK: "#FF9800",
    MILESTONE: "#7EB8F5",
    REALIZATION: "#C9A96E",
  };

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const lastSegment = segments[segments.length - 1];
  const activeColor = "#E8572A";

  return (
    <div className={cn("relative w-full h-[8px] rounded-full mt-4 mb-2", className)}>
      {/* Bar track */}
      <div className="absolute inset-0 bg-surface2 rounded-full overflow-hidden shadow-inner border border-[#222222]" />

      {/* Progress Fill */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute top-0 left-0 h-full rounded-full"
        style={{
          background: `linear-gradient(to right, rgba(232,87,42,0.1), rgba(232,87,42,0.5), #E8572A)`,
        }}
      >
        {/* Glowing Knob */}
        <div 
          className="absolute right-0 top-1/2 w-[14px] h-[14px] rounded-full bg-[#E8572A] border-[2px] border-[#111] z-[1]"
          style={{
            transform: 'translate(50%, -50%)',
            boxShadow: '0 0 20px 8px rgba(232,87,42,0.3)',
          }}
        />
      </motion.div>
      
      {/* Segments/Markers */}
      {segments.map((segment, i) => (
        <div
          key={i}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-[2] cursor-pointer group"
          style={{ left: `${segment.position}%` }}
          onMouseEnter={() => setHoveredIndex(i)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="w-[12px] h-[12px] rounded-full border-2 border-[#111111] transition-all duration-300"
            style={{ 
              backgroundColor: typeColors[segment.type],
              boxShadow: hoveredIndex === i ? `0 0 12px ${typeColors[segment.type]}` : 'none',
              transform: hoveredIndex === i ? 'scale(1.2)' : 'scale(1)'
            }}
          />
          {/* Tooltip */}
          <AnimatePresence>
            {hoveredIndex === i && (
              <motion.div 
                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 2, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 bg-[#111111]/90 backdrop-blur-md border border-[#333333] p-[10px_14px] rounded-lg shadow-2xl text-[0.75rem] whitespace-nowrap z-[10] text-text1 flex flex-col gap-1.5 pointer-events-none"
              >
                <div className="flex items-center gap-2">
                  <div className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: typeColors[segment.type] }} />
                  <span className="font-bold text-[10px] uppercase tracking-wider" style={{ color: typeColors[segment.type] }}>
                    {segment.type}
                  </span>
                </div>
                {segment.title && <span className="font-body font-medium text-[0.85rem] mt-0.5">{segment.title}</span>}
                {segment.date && <span className="text-text3 text-[0.7rem] font-mono opacity-80">{segment.date}</span>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
