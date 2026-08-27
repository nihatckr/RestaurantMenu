import Image from "next/image";

// Venue wordmark + name (DESIGN.md). The wordmark is per-venue data, falling
// back to the Mono mark. Server Component, no client JS.
export function VenueHeader({
  name,
  wordmark,
}: {
  name: string;
  wordmark?: string | null;
}) {
  return (
    <header className="flex flex-col items-center gap-3 py-6">
      {/* Fixed box + object-contain so any wordmark aspect (tall mark or wide
          wordmark) fits without distortion. */}
      <div className="relative h-14 w-44">
        <Image
          src={wordmark || "/brand/mono.svg"}
          alt={name}
          fill
          className="object-contain"
          priority
        />
      </div>
      <h1 className="font-brand text-lg tracking-[0.2em] uppercase text-foreground">
        {name}
      </h1>
    </header>
  );
}
