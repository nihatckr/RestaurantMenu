"use client";

import { useEffect, useState } from "react";

// A floating "back to top" button for the long single-scroll category page.
// Appears once the guest has scrolled down; hidden at the top. Respects
// prefers-reduced-motion (instant jump instead of a smooth scroll).
export function ScrollToTop({ label }: { label: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // No synchronous setState in the effect body — the listener drives it.
    const onScroll = () => setShow(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  function toTop() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label={label}
      className="fixed bottom-5 right-5 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-muted/30 bg-background/90 text-foreground shadow-sm backdrop-blur transition-colors hover:border-foreground"
    >
      <span aria-hidden className="text-lg leading-none">
        ↑
      </span>
    </button>
  );
}
