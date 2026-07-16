"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SplashScreen() {
  const [show, setShow] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 1. Inject the Google Fonts link dynamically
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,700&family=IBM+Plex+Mono&family=IBM+Plex+Sans:wght@300;400;500&family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    // 2. Simulate progress and wait for fonts
    let interval: NodeJS.Timeout;
    
    // We increment progress randomly up to 80-90%.
    interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.random() * 15;
        return next > 85 ? 85 : next;
      });
    }, 200);

    // 3. When fonts are ready, push to 100% and hide
    document.fonts.ready.then(() => {
      // Small artificial delay to ensure smooth visual
      setTimeout(() => {
        clearInterval(interval);
        setProgress(100);
        setTimeout(() => setShow(false), 800);
      }, 1500); // minimum display time
    });

    return () => {
      clearInterval(interval);
    };
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
          <div className="flex flex-col items-center w-full max-w-xs px-8">
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
              className="font-logo italic font-bold tracking-tight text-3xl mb-12"
            >
              <span className="text-accent">ARC</span>
              <span className="text-text1">LINE</span>
            </motion.div>

            {/* Progress bar */}
            <div className="w-full max-w-[200px]">
              <div className="h-[2px] w-full bg-surface2 overflow-hidden rounded-full relative">
                <motion.div 
                  className="absolute left-0 top-0 bottom-0 bg-accent"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
              <motion.div 
                className="mt-4 text-center text-text3 text-[10px] uppercase tracking-widest font-mono"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {progress >= 100 ? "Ready" : "Loading Environment"}
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
