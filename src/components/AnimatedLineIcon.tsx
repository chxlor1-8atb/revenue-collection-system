"use client";

import { motion } from "framer-motion";

interface AnimatedLineIconProps {
  size?: number;
  variant?: "black" | "green" | "white";
  className?: string;
  animate?: boolean;
}

export default function AnimatedLineIcon({
  size = 28,
  variant = "black",
  className = "",
  animate = true,
}: AnimatedLineIconProps) {
  const iconSrc = variant === "green" ? "/icons/line-green.png" : "/icons/line-black.png";

  return (
    <motion.div
      className={`inline-flex items-center justify-center relative shrink-0 ${className}`}
      style={{ width: size, height: size }}
      animate={
        animate
          ? {
              scale: [1, 1.1, 1, 1.06, 1],
              rotate: [0, -4, 4, -2, 0],
            }
          : undefined
      }
      transition={
        animate
          ? {
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }
          : undefined
      }
      whileHover={{ scale: 1.18, rotate: 6 }}
      whileTap={{ scale: 0.9 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={iconSrc}
        alt="LINE"
        style={{ width: size, height: size }}
        className={`object-contain pointer-events-none ${
          variant === "white" ? "brightness-0 invert" : ""
        }`}
      />
    </motion.div>
  );
}
