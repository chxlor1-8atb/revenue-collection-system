"use client";

import { useEffect } from "react";

export default function PrintTrigger() {
  useEffect(() => {
    // Automatically open print dialog after a short delay to allow images/fonts to load
    const timer = setTimeout(() => {
      window.print();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
