import Image from "next/image";

// Venue wordmark + name (DESIGN.md). Server Component, no client JS.
export function VenueHeader({ name }: { name: string }) {
  return (
    <header className="flex flex-col items-center gap-3 py-6">
      <Image src="/brand/mono.svg" alt="Mono" width={56} height={68} priority />
      <h1 className="font-brand text-lg tracking-[0.2em] uppercase text-foreground">
        {name}
      </h1>
    </header>
  );
}
