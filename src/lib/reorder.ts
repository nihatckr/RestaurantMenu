import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type MoveDirection = "up" | "down";

// Move `key`'s row one slot up/down within `rows` (already in display order) and
// renumber every row's sortOrder to its new index — robust even if the current
// sortOrders are equal/duplicated. No-op at the edges. Callers pass a per-model
// `update`; all writes run in one transaction. Shared by category/product
// (data/admin.ts) and venue (data/venues.ts) reordering.
export async function reorder(
  rows: { id: string; key: string }[],
  key: string,
  dir: MoveDirection,
  update: (id: string, sortOrder: number) => Prisma.PrismaPromise<unknown>,
) {
  const idx = rows.findIndex((r) => r.key === key);
  if (idx < 0) return;
  const swapIdx = dir === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= rows.length) return; // already at the edge
  const next = [...rows];
  [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
  await prisma.$transaction(next.map((r, i) => update(r.id, i)));
}
