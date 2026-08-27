import Image from "next/image";
import Link from "next/link";
import { listVenues } from "@/lib/data/menu";

// Root: venue chooser. `listVenues` is cached, so this prerenders static.
export default async function Home() {
  const venues = await listVenues();
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <Image src="/brand/mono.svg" alt="Mono" width={72} height={88} priority />
      <ul className="flex w-full max-w-sm flex-col gap-3">
        {venues.map((v) => (
          <li key={v.slug}>
            <Link
              href={`/${v.slug}`}
              className="flex items-center justify-center rounded-md border border-muted/20 py-4 font-brand text-sm uppercase tracking-[0.2em] transition-colors hover:border-foreground"
            >
              {v.name}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
