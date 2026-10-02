import { describe, expect, test } from "bun:test"
import { JSDOM } from "jsdom"

import { startMarks } from "./start.ts"
import type { StorageArea } from "./store.ts"

const TWEETS = (ids: readonly string[]): string =>
  ids
    .map(
      (id) =>
        `<article data-testid="tweet"><div data-testid="cellInnerDiv"><a href="/u/status/${id}">x</a></div></article>`
    )
    .join("")

const stored = (tweetId: string): Record<string, unknown> => ({
  "bookmark.someone.posts": {
    tweetId,
    seenAt: new Date(1_000_000).toISOString(),
  },
})

const fakeStorage = (
  initial: Record<string, unknown>
): {
  area: StorageArea
  sets: () => number
} => {
  const data = { ...initial }
  let sets = 0
  return {
    area: {
      get: (keys) =>
        Promise.resolve(
          Object.fromEntries(keys.map((key) => [key, data[key]]))
        ),
      set: (items) => {
        sets += 1
        Object.assign(data, items)
        return Promise.resolve()
      },
    },
    sets: () => sets,
  }
}

const profile = (tweetIds: readonly string[]): JSDOM =>
  new JSDOM(
    `<!doctype html><html><body><div data-testid="primaryColumn"><div role="tablist"></div>${TWEETS(tweetIds)}</div></body></html>`,
    { url: "https://x.com/someone" }
  )

const flush = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 20))
}

describe("startMarks", () => {
  test("attach restores the stored mark without recording", async () => {
    const dom = profile(["111", "222"])
    const { area, sets } = fakeStorage(stored("222"))
    const now = 1_000_000
    const stop = startMarks(dom.window.document, area, dom.window, () => now)
    await flush()
    expect(sets()).toBe(0)
    expect(dom.window.document.querySelector("button")?.textContent).toContain(
      "bookmark"
    )
    stop()
  })

  test("home never shows the pill or records", async () => {
    const dom = new JSDOM(
      `<!doctype html><html><body><div data-testid="primaryColumn"><div role="tablist"></div>${TWEETS(["111"])}</div></body></html>`,
      { url: "https://x.com/home" }
    )
    const { area, sets } = fakeStorage(stored("111"))
    let now = 1_000_000
    const stop = startMarks(dom.window.document, area, dom.window, () => now)
    await flush()
    now += 600
    dom.window.dispatchEvent(new dom.window.Event("scroll"))
    await flush()
    expect(dom.window.document.querySelector("button")).toBeNull()
    expect(sets()).toBe(0)
    stop()
  })

  test("a later scroll records the new position", async () => {
    const dom = profile(["111", "222"])
    const { area, sets } = fakeStorage(stored("222"))
    let now = 1_000_000
    const stop = startMarks(dom.window.document, area, dom.window, () => now)
    await flush()
    now += 600
    dom.window.dispatchEvent(new dom.window.Event("scroll"))
    await flush()
    expect(sets()).toBe(1)
    stop()
  })
})

describe("page visibility", () => {
  test("startMarks sets no attribute on the document element", async () => {
    const dom = profile(["111"])
    const { area } = fakeStorage({})
    const stop = startMarks(dom.window.document, area, dom.window, () => 1)
    await flush()
    expect(dom.window.document.documentElement.getAttributeNames()).toEqual([])
    stop()
  })

  test("a second start on the same document does not attach again", async () => {
    const dom = profile(["111"])
    const { area } = fakeStorage(stored("111"))
    const stop = startMarks(dom.window.document, area, dom.window, () => 1)
    const again = startMarks(dom.window.document, area, dom.window, () => 1)
    await flush()
    expect(dom.window.document.querySelectorAll("button").length).toBe(1)
    again()
    stop()
  })
})
