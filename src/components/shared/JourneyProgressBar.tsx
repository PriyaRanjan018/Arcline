"use client";

import { motion } from "framer-motion";
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

  return (
    <div className={cn("relative w-full h-[12px]", className)}>
      {/* Bar track */}
      <div className="absolute top-0 left-0 right-0 bottom-0 bg-[#222222] h-[12px]" />

      {/* Progress Fill */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute top-0 left-0 h-[12px] bg-text2 opacity-20"
      />
      
      {/* Segments/Markers */}
      {segments.map((segment, i) => (
        <div
          key={i}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-[2] cursor-pointer"
          style={{ left: `${segment.position}%` }}
          onMouseEnter={() => setHoveredIndex(i)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="w-[10px] h-[10px] rounded-full border-2 border-[#080808]"
            style={{ 
              backgroundColor: typeColors[segment.type] 
            }}
          />
          {/* Tooltip */}
          {hoveredIndex === i && (
            <div 
              className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 bg-[#111111] border border-[#333333] p-[6px_10px] text-[0.68rem] whitespace-nowrap z-[10] text-text1 font-mono flex flex-col gap-1 pointer-events-none"
            >
              <span className="font-bold text-[10px] uppercase tracking-wider" style={{ color: typeColors[segment.type] }}>{segment.type}</span>
              {segment.title && <span>{segment.title}</span>}
              {segment.date && <span className="text-text3">{segment.date}</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
