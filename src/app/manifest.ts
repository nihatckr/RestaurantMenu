import type { MetadataRoute } from "next";

// PWA manifest — makes the menu installable ("Add to Home Screen") for QR guests.
// Invisible to the page itself; only affects install/standalone chrome. This is a
// single global resource (not per-locale), so the labels are language-neutral
// brand text rather than any one language's word for "menu".
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mono Terrace",
    short_name: "Mono",
    description: "Mono Terrace & Garden digital menu.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
