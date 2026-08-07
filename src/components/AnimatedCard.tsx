"use client";

import { motion, HTMLMotionProps } from "framer-motion";

interface AnimatedCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  delay?: number;
}

export default function AnimatedCard({ children, className, delay = 0, ...props }: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 24,
        delay: delay 
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
