import Image from "next/image";

// Product image, or the brand's placeholder box when absent (PR11 — never a
// broken image). Remote hosts must be allowlisted in next.config (SECURITY.md
// §1). Figma card image box has only the TOP corners rounded; food is ~square
// (110×100) and cocktails are a tall portrait tile (5-up grid).
export function ImageWithPlaceholder({
  src,
  alt,
  portrait = false,
}: {
  src: string | null;
  alt: string;
  portrait?: boolean;
}) {
  const aspect = portrait ? "aspect-[4/9]" : "aspect-[11/10]";
  if (!src) {
    return (
      <div className={`${aspect} w-full rounded-t-md bg-placeholder`} aria-hidden />
    );
  }
  // Serve a right-sized source: cocktails are 5-up (~20vw), food 3-up on mobile →
  // 4-up on desktop (~33vw→25vw). `bg-placeholder` shows the brand pink while the
  // image loads (no blank flash) — invisible once the photo paints over it.
  const sizes = portrait
    ? "20vw"
    : "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw";
  return (
    <Image
      src={src}
      alt={alt}
      width={portrait ? 160 : 330}
      height={portrait ? 360 : 300}
      sizes={sizes}
      className={`${aspect} w-full rounded-t-md bg-placeholder object-cover`}
    />
  );
}
