"use client";

import { useEffect, useRef } from "react";
import type { AnimationItem } from "lottie-web";

interface LottieIconProps {
  src: string | object;
  size?: number;
  loop?: boolean;
  autoplay?: boolean;
  playOnHover?: boolean;
  className?: string;
  color?: string; // Optional CSS filter or color style
}

export default function LottieIcon({
  src,
  size = 28,
  loop = true,
  autoplay = true,
  playOnHover = false,
  className = "",
}: LottieIconProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let isMounted = true;

    // Clear previous animation if any
    if (animRef.current) {
      animRef.current.destroy();
    }

    import("lottie-web/build/player/lottie_light").then((lottieModule) => {
      if (!isMounted || !containerRef.current) return;
      const lottie = lottieModule.default;
      
      try {
        const anim = lottie.loadAnimation({
          container: containerRef.current,
          renderer: "svg",
          loop: playOnHover ? false : loop,
          autoplay: playOnHover ? false : autoplay,
          ...(typeof src === "string" ? { path: src } : { animationData: src }),
        });

        animRef.current = anim;
      } catch (err) {
        console.error("Lottie load error:", err);
      }
    });

    return () => {
      isMounted = false;
      if (animRef.current) {
        animRef.current.destroy();
        animRef.current = null;
      }
    };
  }, [src, loop, autoplay, playOnHover]);

  const handleMouseEnter = () => {
    if (playOnHover && animRef.current) {
      animRef.current.goToAndPlay(0, true);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      style={{ width: size, height: size }}
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
    />
  );
}
