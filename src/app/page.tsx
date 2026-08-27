import Image from "next/image";

// Foundation placeholder (T1). Real routing is the dynamic venue path
// `/[locale]/[venueSlug]` (ARCHITECTURE.md), built in later stages.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8 text-center">
      <Image
        src="/brand/mono.svg"
        alt="Mono"
        width={84}
        height={102}
        priority
      />
      <div className="space-y-2">
        <h1 className="font-brand text-2xl tracking-[0.15em] text-foreground">
          MONO TERRACE
        </h1>
        <p className="font-body text-sm text-muted">
          Menu foundation ready — venue routing coming next.
        </p>
      </div>
    </main>
  );
}
