"use client";

import { useEffect } from "react";

// Fire-and-forget menu-open beacon on the venue landing (the QR destination).
// Renders nothing; the fetch keeps the public page static (client-initiated).
export function TrackView({
  venueSlug,
  locale,
}: {
  venueSlug: string;
  locale: string;
}) {
  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ venueSlug, locale }),
      keepalive: true,
    }).catch(() => {});
  }, [venueSlug, locale]);
  return null;
}
