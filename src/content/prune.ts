import { BOOKMARK_PREFIX, parseBookmark } from "./bookmark.ts"

const STALE_HOME_PREFIX = `${BOOKMARK_PREFIX}home.`

export const MAX_BOOKMARKS = 200
export const BOOKMARK_TTL_MS = 90 * 24 * 60 * 60 * 1000

export interface PruneStorageArea {
  get(keys: null): Promise<Record<string, unknown>>
  remove(keys: string[]): Promise<void>
}

const bookmarkKeys = (all: Record<string, unknown>): string[] =>
  Object.keys(all).filter((key) => key.startsWith(BOOKMARK_PREFIX))

const seenAtMs = (value: unknown): number =>
  Date.parse(parseBookmark(value)?.seenAt ?? "")

export const pruneBookmarks = async (
  storage: PruneStorageArea,
  now: () => number = Date.now
): Promise<void> => {
  const all = await storage.get(null)
  const oldest = now() - BOOKMARK_TTL_MS
  const stale: string[] = []
  const kept: { key: string; at: number }[] = []
  for (const key of bookmarkKeys(all)) {
    const at = seenAtMs(all[key])
    if (key.startsWith(STALE_HOME_PREFIX) || Number.isNaN(at) || at < oldest)
      stale.push(key)
    else kept.push({ key, at })
  }
  kept.sort((a, b) => b.at - a.at)
  for (const { key } of kept.slice(MAX_BOOKMARKS)) stale.push(key)
  if (stale.length > 0) await storage.remove(stale)
}

export const countBookmarks = async (
  storage: PruneStorageArea
): Promise<number> => bookmarkKeys(await storage.get(null)).length

export const clearBookmarks = async (
  storage: PruneStorageArea
): Promise<number> => {
  const keys = bookmarkKeys(await storage.get(null))
  if (keys.length > 0) await storage.remove(keys)
  return keys.length
}
