import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

// Figma landing: the MONO (MO/NO) mark centered at the top; the venue wordmark
// sits at the very bottom (see the landing page footer). The venue name is kept
// as an sr-only <h1> for accessibility/SEO without duplicating the wordmark. The
// mark links "home" (`homeHref`) — the common logo affordance.
export function VenueHeader({
  name,
  homeHref,
  mark = BRAND.mark,
}: {
  name: string;
  homeHref: string;
  mark?: string;
}) {
  return (
    <header className="flex flex-col items-center py-6">
      <Link href={homeHref} aria-label={BRAND.name} className="relative block h-16 w-14">
        <Image src={mark} alt={BRAND.name} fill className="object-contain" priority />
      </Link>
      <h1 className="sr-only">{name}</h1>
    </header>
  );
}
