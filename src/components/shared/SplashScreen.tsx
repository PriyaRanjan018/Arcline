"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SplashScreen() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Hide the splash screen after the animation completes
    const timer = setTimeout(() => {
      setShow(false);
    }, 2800); // 2.8s total duration

    return () => clearTimeout(timer);
  }, []);

  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { 
      pathLength: 1, 
      opacity: 1,
      transition: { 
        duration: 1.5, 
        ease: "easeInOut",
      } 
    }
  };

  const textVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        delay: 1.2,
        duration: 0.8, 
        ease: "easeOut" 
      } 
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg"
        >
          <div className="flex flex-col items-center">
            {/* Animated Monogram */}
            <svg
              width={80}
              height={80}
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mb-6"
            >
              <motion.path
                d="M4 28 L16 4"
                stroke="#E8572A"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                variants={pathVariants}
                initial="hidden"
                animate="visible"
              />
              <motion.path
                d="M28 28 L16 4"
                stroke="#F2EDE4"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                variants={pathVariants}
                initial="hidden"
                animate="visible"
              />
              <motion.path
                d="M8.5 20 Q16 14.5 23.5 20"
                stroke="#E8572A"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                variants={pathVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.8, duration: 1, ease: "easeInOut" }} // draw the crossbar slightly later
              />
            </svg>

            {/* Fading in Logo Text */}
            <motion.div 
              variants={textVariants}
              initial="hidden"
              animate="visible"
              className="font-logo italic font-bold tracking-tight text-3xl"
            >
              <span className="text-accent">ARC</span>
              <span className="text-text1">LINE</span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
