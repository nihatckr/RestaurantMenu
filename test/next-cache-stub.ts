// Vitest stub for `next/cache`. Outside a Next build there is no `cacheComponents`
// runtime, so `cacheTag()` throws and `revalidateTag()` has no cache to touch. The
// integration tests exercise the data-access DB behaviour, not caching — so these
// are safe no-ops here. Params are omitted (JS ignores extra call-site args); tsc
// still type-checks callers against the real `next/cache` types.
export function cacheTag(): void {}
export function revalidateTag(): void {}
export function updateTag(): void {}
export function revalidatePath(): void {}
export function cacheLife(): void {}
