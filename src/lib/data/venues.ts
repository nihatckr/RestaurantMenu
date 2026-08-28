import "server-only";
import { prisma } from "@/lib/db";
import { slugify, uniqueSlug } from "@/lib/slug";
import { deleteImage } from "@/lib/images";

// Venue CRUD for the admin Settings → Mekanlar tab. A venue owns exactly one
// Menu (created with it); deleting a venue cascades its Menu (categories/items
// links) but never the business-level Product/Category catalog.

export type MoveDirection = "up" | "down";

/** Create a venue (auto-slug) with its empty Menu, appended to the chooser order. */
export async function createVenue(name: string) {
  const business = await prisma.business.findFirst({ select: { id: true } });
  if (!business) throw new Error("İşletme bulunamadı.");
  const taken = new Set(
    (await prisma.venue.findMany({ select: { slug: true } })).map((v) => v.slug),
  );
  const slug = uniqueSlug(slugify(name), taken);
  const max = await prisma.venue.aggregate({ _max: { sortOrder: true } });
  await prisma.venue.create({
    data: {
      businessId: business.id,
      slug,
      name: name.trim(),
      sortOrder: (max._max.sortOrder ?? 0) + 1,
      menu: { create: {} },
    },
  });
}

/** Rename a venue (slug/URL stays stable). */
export async function updateVenueName(venueSlug: string, name: string) {
  await prisma.venue.updateMany({ where: { slug: venueSlug }, data: { name: name.trim() } });
}

/** Delete a venue + its menu (cascade). Refuses to remove the last one. */
export async function deleteVenue(venueSlug: string) {
  const count = await prisma.venue.count();
  if (count <= 1) throw new Error("En az bir mekan kalmalı.");
  const venue = await prisma.venue.findUnique({
    where: { slug: venueSlug },
    select: { id: true, wordmark: true },
  });
  if (!venue) return;
  await prisma.venue.delete({ where: { id: venue.id } });
  await deleteImage(venue.wordmark);
}

/** Move a venue up/down in the chooser order (renumbered, edge = no-op). */
export async function moveVenue(venueSlug: string, dir: MoveDirection) {
  const rows = await prisma.venue.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, slug: true },
  });
  const idx = rows.findIndex((r) => r.slug === venueSlug);
  if (idx < 0) return;
  const swap = dir === "up" ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= rows.length) return;
  const next = [...rows];
  [next[idx], next[swap]] = [next[swap], next[idx]];
  await prisma.$transaction(
    next.map((r, i) => prisma.venue.update({ where: { id: r.id }, data: { sortOrder: i } })),
  );
}
