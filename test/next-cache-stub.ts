// Vitest stub for `next/cache`. Outside a Next build there is no `cacheComponents`
// runtime, so `cacheTag()` throws and `revalidateTag()` has no cache to touch. The
// integration tests exercise the data-access DB behaviour, not caching — so these
// are safe no-ops here.
export function cacheTag(..._tags: string[]): void {}
export function revalidateTag(_tag: string, _profile?: unknown): void {}
export function updateTag(_tag: string): void {}
export function revalidatePath(_path: string, _type?: unknown): void {}
export function cacheLife(_profile: unknown): void {}
