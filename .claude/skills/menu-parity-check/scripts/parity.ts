/**
 * Legacy parity checker (template).
 *
 * Deterministic assertions for `menu-parity-check`. Wire the TODOs to the
 * data-access layer (ARCHITECTURE.md) once it exists (T3). Run with:
 *   npx tsx .claude/skills/menu-parity-check/scripts/parity.ts
 *
 * Exit code 0 = all pass, 1 = at least one failure. Output is plain text so an
 * agent can read results from the terminal without loading this file's code.
 */

type Check = { name: string; ok: boolean; detail?: string };
const checks: Check[] = [];
const assert = (name: string, ok: boolean, detail?: string) =>
  checks.push({ name, ok, detail });

async function run() {
  // TODO(T3): import { getVenueBySlug, getMenuForVenue, listCategoriesForVenue }
  //           from the data-access layer, then replace the stubs below.

  // 1. Shared catalog: same product id can appear in >1 venue via MenuItems.
  // assert('shared-catalog', await productAppearsInMultipleVenues(), ...);

  // 2. Per-venue visibility: hidden items/categories do not render.
  //    e.g. if kept: Terrace hides Breakfast, Garden shows it.
  // assert('per-venue-visibility', ...);

  // 3. Category ordering matches the venue's configured order.
  // assert('category-order', ...);

  // 4. Item schema: title, tr+en(+ru) text, price, image-or-placeholder,
  //    structured drink measures.
  // assert('item-schema', ...);

  // 5. Flow + i18n fallback (tr) — usually covered by e2e; assert data here.
  // assert('i18n-fallback', ...);

  if (checks.length === 0) {
    console.log(
      'parity: no checks wired yet (pre-T3). Fill the TODOs against the data-access layer.'
    );
    process.exit(0);
  }

  let failed = 0;
  for (const c of checks) {
    console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? ` — ${c.detail}` : ''}`);
    if (!c.ok) failed++;
  }
  console.log(`\nparity: ${checks.length - failed}/${checks.length} passed`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error('parity: error', e);
  process.exit(1);
});
