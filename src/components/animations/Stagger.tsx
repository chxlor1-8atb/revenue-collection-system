"use client";

import { motion } from "framer-motion";
import { ReactNode, forwardRef } from "react";

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  delayChildren?: number;
  staggerChildren?: number;
}

export const StaggerContainer = forwardRef<HTMLDivElement, StaggerContainerProps>(
  ({ children, className, delayChildren = 0, staggerChildren = 0.1 }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: {
            transition: {
              delayChildren,
              staggerChildren,
            },
          },
        }}
        className={className}
      >
        {children}
      </motion.div>
    );
  }
);
StaggerContainer.displayName = "StaggerContainer";

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

export const StaggerItem = forwardRef<HTMLDivElement, StaggerItemProps>(
  ({ children, className }, ref) => {
    return (
      <motion.div
        ref={ref}
        variants={{
          hidden: { opacity: 0, y: 20 },
          show: { 
            opacity: 1, 
            y: 0, 
            transition: { 
              duration: 0.5, 
              ease: [0.16, 1, 0.3, 1] // Custom spring-like easing
            } 
          },
        }}
        className={className}
      >
        {children}
      </motion.div>
    );
  }
);
StaggerItem.displayName = "StaggerItem";
