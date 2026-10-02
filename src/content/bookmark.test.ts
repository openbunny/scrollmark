import { describe, expect, test } from "bun:test"

import { pickFirstVisible, parseBookmark } from "./bookmark.ts"

describe("parseBookmark", () => {
  test("accepts a well-formed record", () => {
    expect(
      parseBookmark({ tweetId: "123", seenAt: "2026-01-01T00:00:00.000Z" })
    ).toEqual({ tweetId: "123", seenAt: "2026-01-01T00:00:00.000Z" })
  })

  test("rejects non-numeric ids and missing fields", () => {
    expect(parseBookmark({ tweetId: "abc", seenAt: "x" })).toBeUndefined()
    expect(parseBookmark({ tweetId: "123" })).toBeUndefined()
    expect(parseBookmark(undefined)).toBeUndefined()
    expect(parseBookmark("bookmark")).toBeUndefined()
  })
})

describe("pickFirstVisible", () => {
  test("returns the first box whose top is on screen", () => {
    expect(
      pickFirstVisible([
        { top: -400, bottom: -100 },
        { top: 10, bottom: 300 },
        { top: 320, bottom: 600 },
      ])
    ).toBe(1)
  })

  test("prefers a straddling box over boxes below it", () => {
    expect(
      pickFirstVisible([
        { top: -50, bottom: 200 },
        { top: 220, bottom: 500 },
      ])
    ).toBe(0)
  })

  test("falls back to the nearest box above when nothing is visible", () => {
    expect(
      pickFirstVisible([
        { top: -600, bottom: -400 },
        { top: -300, bottom: -50 },
      ])
    ).toBe(1)
  })

  test("returns -1 for an empty timeline", () => {
    expect(pickFirstVisible([])).toBe(-1)
  })
})
