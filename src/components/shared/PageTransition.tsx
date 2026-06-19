"use client";

import { motion } from "framer-motion";
import { animations } from "@/lib/animations";

export default function PageTransition({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={animations.pageEnter}
      className={className}
    >
      {children}
    </motion.div>
  );
}
