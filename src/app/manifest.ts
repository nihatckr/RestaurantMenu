import type { MetadataRoute } from "next";

// PWA manifest — makes the menu installable ("Add to Home Screen") for QR guests.
// Invisible to the page itself; only affects install/standalone chrome.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mono Terrace — Menü",
    short_name: "Mono Menü",
    description: "Mono Terrace & Garden dijital menü.",
    lang: "tr",
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
