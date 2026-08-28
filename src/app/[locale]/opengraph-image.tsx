import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";

// Social share card (og:image) for every localized page — the brand wordmark on
// the brand black. One generated image (no committed binary); Next wires up the
// <meta> tags. Uses a system font so no font file needs loading at the edge.
export const alt = "Mono Terrace — Menu";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND.black,
          color: BRAND.white,
          fontSize: 240,
          fontWeight: 800,
          letterSpacing: 24,
        }}
      >
        MONO
      </div>
    ),
    size,
  );
}
