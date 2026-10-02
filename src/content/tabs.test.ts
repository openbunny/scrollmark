import { describe, expect, test } from "bun:test"

import {
  bookmarkKey,
  DEFAULT_TAB,
  parseRoute,
  PROFILE_TABS,
  profileTabFromDom,
  type ProfileTab,
} from "./tabs.ts"

describe("parseRoute", () => {
  test("profile root defaults to posts", () => {
    expect(parseRoute(new URL("https://x.com/someone"))).toEqual({
      kind: "profile",
      handle: "someone",
      tab: "posts",
    })
  })

  test("with_replies maps to replies", () => {
    expect(parseRoute(new URL("https://x.com/someone/with_replies"))).toEqual({
      kind: "profile",
      handle: "someone",
      tab: "replies",
    })
  })

  test("media maps to media", () => {
    expect(parseRoute(new URL("https://x.com/someone/media"))).toEqual({
      kind: "profile",
      handle: "someone",
      tab: "media",
    })
  })

  test("likes maps to articles", () => {
    expect(parseRoute(new URL("https://x.com/someone/likes"))).toEqual({
      kind: "profile",
      handle: "someone",
      tab: "articles",
    })
  })

  test("dom label selects the profile tab", () => {
    expect(parseRoute(new URL("https://x.com/someone"), "Reposts")).toEqual({
      kind: "profile",
      handle: "someone",
      tab: "reposts",
    })
  })

  test("home and root are other", () => {
    expect(parseRoute(new URL("https://x.com/home"), "Following")).toEqual({
      kind: "other",
    })
    expect(parseRoute(new URL("https://x.com/"))).toEqual({ kind: "other" })
  })

  test("reserved sections are other", () => {
    expect(parseRoute(new URL("https://x.com/settings/account"))).toEqual({
      kind: "other",
    })
    expect(parseRoute(new URL("https://x.com/i/timeline"))).toEqual({
      kind: "other",
    })
  })
})

describe("profileTabFromDom", () => {
  test("names the selected tab and rejects the rest", () => {
    const tab: ProfileTab = "replies"
    expect(profileTabFromDom("Replies")).toBe(tab)
    expect(profileTabFromDom("Highlights")).toBeUndefined()
    expect(profileTabFromDom(undefined)).toBeUndefined()
  })

  test("every tab has a key", () => {
    expect(DEFAULT_TAB).toBe("posts")
    expect([...PROFILE_TABS]).toContain("articles")
  })
})

describe("bookmarkKey", () => {
  test("keys are per handle and tab", () => {
    expect(
      bookmarkKey({ kind: "profile", handle: "Someone", tab: "media" })
    ).toBe("bookmark.someone.media")
    expect(bookmarkKey({ kind: "other" })).toBeUndefined()
  })
})
