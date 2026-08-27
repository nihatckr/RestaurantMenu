import Image from "next/image";

// Figma landing: the MONO (MO/NO) mark centered at the top; the venue wordmark
// sits at the very bottom (see the landing page footer). The venue name is kept
// as an sr-only <h1> for accessibility/SEO without duplicating the wordmark.
export function VenueHeader({ name }: { name: string }) {
  return (
    <header className="flex flex-col items-center py-6">
      <div className="relative h-16 w-14">
        <Image
          src="/brand/mono.svg"
          alt="Mono"
          fill
          className="object-contain"
          priority
        />
      </div>
      <h1 className="sr-only">{name}</h1>
    </header>
  );
}
