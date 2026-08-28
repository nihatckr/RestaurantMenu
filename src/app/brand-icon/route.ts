import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { getBrandLogo } from "@/lib/data/settings";

// Favicon generated from the admin-uploaded brand logo (DECISIONS B.11): resized
// to a transparent 64×64 PNG via sharp. Falls back to the packaged Mono mark, and
// to the static PWA icon if anything fails — a favicon must never 500.
// (Node runtime is the default; sharp/fs require it. An explicit `runtime`
// export isn't allowed under cacheComponents.)

async function sourceBytes(): Promise<Buffer> {
  const logo = await getBrandLogo();
  if (logo?.startsWith("http")) {
    const res = await fetch(logo);
    if (res.ok) return Buffer.from(await res.arrayBuffer());
  } else if (logo?.startsWith("/uploads/")) {
    return readFile(path.join(process.cwd(), "public", logo.slice(1)));
  }
  // Default: the packaged brand mark (SVG rasterizes via sharp).
  return readFile(path.join(process.cwd(), "public", "brand", "mono.svg"));
}

export async function GET() {
  try {
    const png = await sharp(await sourceBytes())
      .resize(64, 64, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    return new Response(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch {
    const fallback = await readFile(
      path.join(process.cwd(), "public", "icon-192.png"),
    );
    return new Response(new Uint8Array(fallback), {
      headers: { "Content-Type": "image/png" },
    });
  }
}
