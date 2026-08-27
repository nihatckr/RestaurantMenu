import Image from "next/image";

// Product image, or the brand's translucent placeholder box when absent (PR11 —
// never a broken image). Remote hosts must be allowlisted in next.config
// (SECURITY.md §1); seeded products currently have no image, so the placeholder
// shows.
export function ImageWithPlaceholder({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) {
  if (!src) {
    return (
      <div
        className="aspect-[4/3] w-full rounded-md bg-placeholder/20"
        aria-hidden
      />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={400}
      height={300}
      className="aspect-[4/3] w-full rounded-md object-cover"
    />
  );
}
