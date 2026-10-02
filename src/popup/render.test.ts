import { describe, expect, test } from "bun:test"
import { JSDOM } from "jsdom"

import type { PruneStorageArea } from "../content/prune.ts"
import { renderPopup, statusText } from "./render.ts"

const fakeStorage = (
  initial: Record<string, unknown>
): { area: PruneStorageArea; data: Record<string, unknown> } => {
  const data = { ...initial }
  return {
    area: {
      get: () => Promise.resolve({ ...data }),
      remove: (keys) => {
        for (const key of keys) delete data[key]
        return Promise.resolve()
      },
    },
    data,
  }
}

const flush = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 10))
}

const page = (): Document =>
  new JSDOM("<!doctype html><body></body>").window.document

describe("statusText", () => {
  test("names zero, one and many", () => {
    expect(statusText(0)).toBe("no saved bookmarks")
    expect(statusText(1)).toBe("1 saved bookmark")
    expect(statusText(3)).toBe("3 saved bookmarks")
  })
})

describe("renderPopup", () => {
  test("shows the count and clears every bookmark on click", async () => {
    const doc = page()
    const { area, data } = fakeStorage({
      "bookmark.a.posts": { tweetId: "1", seenAt: "x" },
      "bookmark.b.posts": { tweetId: "2", seenAt: "y" },
      other: 1,
    })
    await renderPopup(doc, area)
    expect(doc.querySelector("p")?.textContent).toBe("2 saved bookmarks")
    doc.querySelector("button")?.click()
    await flush()
    expect(doc.querySelector("p")?.textContent).toBe("no saved bookmarks")
    expect(Object.keys(data)).toEqual(["other"])
  })

  test("disables the button when nothing is saved", async () => {
    const doc = page()
    await renderPopup(doc, fakeStorage({}).area)
    expect(doc.querySelector("button")?.disabled).toBe(true)
  })
})
