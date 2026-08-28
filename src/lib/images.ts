import "server-only";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { put, del } from "@vercel/blob";

// Server-side image pipeline (SECURITY.md §2: re-encode every upload; never trust
// the bytes). sharp strips metadata and produces a bounded WebP; the optimized
// file is then stored in Vercel Blob (production) or a local /public/uploads
// folder (dev/e2e, when no BLOB token is set) so the flow is testable offline.

const MAX_WIDTH = 1200; // plenty for menu photos; keeps blobs small
const WEBP_QUALITY = 78;
const MAX_INPUT_BYTES = 8 * 1024 * 1024; // reject oversized uploads before decoding

export class ImageError extends Error {}

/** Re-encode arbitrary image bytes into a bounded, metadata-stripped WebP. */
export async function optimizeImage(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate() // honour EXIF orientation, then drop metadata
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}

/**
 * Optimize + store an uploaded image, returning its public URL.
 * `keyPrefix` groups files for tidiness only (e.g. "products"); the DB URL is the
 * source of truth — no logic ever parses the path.
 */
export async function uploadImage(file: File, keyPrefix: string): Promise<string> {
  if (!file.type.startsWith("image/")) throw new ImageError("Görsel dosyası seçin.");
  if (file.size > MAX_INPUT_BYTES) throw new ImageError("Görsel 8MB'den küçük olmalı.");

  let buffer: Buffer;
  try {
    buffer = await optimizeImage(Buffer.from(await file.arrayBuffer()));
  } catch {
    throw new ImageError("Görsel işlenemedi (bozuk veya desteklenmeyen dosya).");
  }

  const key = `${keyPrefix}/${crypto.randomUUID()}.webp`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { url } = await put(key, buffer, {
      access: "public",
      contentType: "image/webp",
    });
    return url;
  }

  // No blob token: the local-disk fallback below is only durable on a persistent
  // filesystem (local dev / self-hosted). On Vercel the fs is ephemeral/read-only,
  // so a "successful" upload would silently vanish on the next request — fail loud
  // instead, so the owner knows to configure a Blob store.
  if (process.env.VERCEL) {
    throw new ImageError(
      "Görsel deposu yapılandırılmamış. Kalıcı yükleme için Vercel’de bir Blob deposu oluşturup BLOB_READ_WRITE_TOKEN ekleyin.",
    );
  }

  // Dev/e2e fallback: write under public/uploads and return a same-origin path.
  const rel = path.posix.join("uploads", key);
  const abs = path.join(process.cwd(), "public", rel);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, buffer);
  return `/${rel}`;
}

/**
 * Resolve the image side-effect from a submitted form (shared by the product and
 * settings actions): a new `image` file → optimize+upload and return its URL;
 * `removeImage=on` → null (clear); neither → undefined (leave unchanged).
 */
export async function resolveUploadedImage(
  formData: FormData,
  prefix: string,
): Promise<string | null | undefined> {
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) return uploadImage(file, prefix);
  return formData.get("removeImage") === "on" ? null : undefined;
}

/** Best-effort delete of a previously uploaded image (orphan cleanup). Never
 *  throws — a failed cleanup must not block the mutation that triggered it. */
export async function deleteImage(url: string | null | undefined): Promise<void> {
  if (!url) return;
  try {
    if (url.startsWith("http")) {
      if (process.env.BLOB_READ_WRITE_TOKEN) await del(url);
    } else if (url.startsWith("/uploads/")) {
      await unlink(path.join(process.cwd(), "public", url.slice(1)));
    }
  } catch {
    // swallow — orphaned blobs are cleaned up separately (OPS.md)
  }
}
