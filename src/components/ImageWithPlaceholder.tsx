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
  return (
    <Image
      src={src}
      alt={alt}
      width={portrait ? 160 : 330}
      height={portrait ? 360 : 300}
      className={`${aspect} w-full rounded-t-md object-cover`}
    />
  );
}
