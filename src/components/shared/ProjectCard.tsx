"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { animations } from "@/lib/animations";
import { cn } from "@/lib/utils";
import StageBadge from "./StageBadge";
import Avatar from "./Avatar";

interface ProjectCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  project: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  builder?: any;
  username?: string;  // explicit username override (for Supabase projects that lack builderId)
  className?: string;
}

export default function ProjectCard({ project, builder, username, className }: ProjectCardProps) {
  const builderSlug = username ?? project.builderId ?? project.profiles?.username;
  const projectSlug = project.slug ?? project.id;
  return (
    <motion.div
      variants={animations.staggerItem}
      whileHover={{ y: -2, borderColor: 'var(--border-2)' }}
      className={cn(
        "bg-surface border border-border p-5 rounded-none flex flex-col h-full",
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <StageBadge stage={project.stage} />
        {builder && (
          <Link href={`/${builder.username}`}>
            <Avatar initials={builder.initials} src={builder.avatarUrl || builder.avatar_url} bgColor={builder.avatarBg} size="sm" />
          </Link>
        )}
      </div>

      <div className="flex-1">
        <h3 className="text-lg font-display font-bold mb-2">
          <Link href={`/${builderSlug}/${projectSlug}`} className="hover:text-accent transition-colors">
            {project.name || project.title}
          </Link>
        </h3>
        <p className="text-sm text-text2 line-clamp-2">{project.description || project.tagline}</p>
      </div>

      <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
        <div className="text-xs text-text3 font-mono">
          {(project.entriesCount ?? project.entry_count ?? 0)} ENTRIES
        </div>
        <Link 
          href={`/${builderSlug}/${projectSlug}`}
          className="text-sm text-accent hover:text-white transition-colors font-medium flex items-center gap-1"
        >
          Open build log &rarr;
        </Link>
      </div>
    </motion.div>
  );
}
