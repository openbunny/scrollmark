import { describe, expect, test } from "bun:test"

import {
  BOOKMARK_TTL_MS,
  clearBookmarks,
  countBookmarks,
  MAX_BOOKMARKS,
  pruneBookmarks,
} from "./prune.ts"
import type { PruneStorageArea } from "./prune.ts"

const NOW = Date.UTC(2026, 9, 1)

const entry = (tweetId: string, seenAtMs: number): unknown => ({
  tweetId,
  seenAt: new Date(seenAtMs).toISOString(),
})

const fakeStorage = (
  initial: Record<string, unknown>
): {
  area: PruneStorageArea
  data: Record<string, unknown>
  removed: string[][]
} => {
  const data = { ...initial }
  const removed: string[][] = []
  return {
    area: {
      get: () => Promise.resolve({ ...data }),
      remove: (keys) => {
        removed.push(keys)
        for (const key of keys) delete data[key]
        return Promise.resolve()
      },
    },
    data,
    removed,
  }
}

describe("pruneBookmarks", () => {
  test("removes bookmark.home.* keys and keeps recent profile bookmarks", async () => {
    const { area, data } = fakeStorage({
      "bookmark.home.foryou": entry("1", NOW),
      "bookmark.acme.posts": entry("2", NOW),
    })
    await pruneBookmarks(area, () => NOW)
    expect(data["bookmark.home.foryou"]).toBeUndefined()
    expect(data["bookmark.acme.posts"]).toEqual(entry("2", NOW))
  })

  test("removes bookmarks of any tab older than the retention period", async () => {
    const { area, data } = fakeStorage({
      "bookmark.acme.posts": entry("2", NOW - BOOKMARK_TTL_MS - 1),
      "bookmark.acme.replies": entry("3", NOW - BOOKMARK_TTL_MS + 1),
    })
    await pruneBookmarks(area, () => NOW)
    expect(Object.keys(data)).toEqual(["bookmark.acme.replies"])
  })

  test("removes bookmark records that do not parse", async () => {
    const { area, data } = fakeStorage({
      "bookmark.acme.posts": { tweetId: "x" },
      "bookmark.acme.media": "text",
    })
    await pruneBookmarks(area, () => NOW)
    expect(Object.keys(data)).toEqual([])
  })

  test("keeps the newest entries up to the cap", async () => {
    const initial: Record<string, unknown> = {}
    for (let index = 0; index < MAX_BOOKMARKS + 5; index += 1)
      initial[`bookmark.user${String(index)}.posts`] = entry(
        String(index + 1),
        NOW - index * 1000
      )
    const { area, data } = fakeStorage(initial)
    await pruneBookmarks(area, () => NOW)
    const keys = Object.keys(data)
    expect(keys.length).toBe(MAX_BOOKMARKS)
    expect(keys).toContain("bookmark.user0.posts")
    expect(keys).not.toContain(`bookmark.user${String(MAX_BOOKMARKS)}.posts`)
  })

  test("leaves keys outside the bookmark prefix untouched", async () => {
    const { area, data } = fakeStorage({ other: "x" })
    await pruneBookmarks(area, () => NOW)
    expect(data["other"]).toBe("x")
  })

  test("does not call remove when nothing is stale", async () => {
    const { area, removed } = fakeStorage({
      "bookmark.acme.posts": entry("2", NOW),
    })
    await pruneBookmarks(area, () => NOW)
    expect(removed.length).toBe(0)
  })
})

describe("countBookmarks and clearBookmarks", () => {
  test("count includes only bookmark keys", async () => {
    const { area } = fakeStorage({
      "bookmark.a.posts": entry("1", NOW),
      "bookmark.b.posts": entry("2", NOW),
      other: 1,
    })
    expect(await countBookmarks(area)).toBe(2)
  })

  test("clear removes every bookmark key, reports the count and keeps other keys", async () => {
    const { area, data } = fakeStorage({
      "bookmark.a.posts": entry("1", NOW),
      "bookmark.b.posts": entry("2", NOW),
      other: 1,
    })
    expect(await clearBookmarks(area)).toBe(2)
    expect(Object.keys(data)).toEqual(["other"])
  })

  test("clear on an empty store removes nothing and reports zero", async () => {
    const { area, removed } = fakeStorage({})
    expect(await clearBookmarks(area)).toBe(0)
    expect(removed.length).toBe(0)
  })
})
