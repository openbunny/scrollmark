import { describe, expect, test } from "bun:test"
import { JSDOM } from "jsdom"

import {
  ensurePill,
  PILL_MARKER,
  PILL_TEXT,
  PILL_TEXT_COLOR,
  removePill,
} from "./pill.ts"
import {
  tweetIdFromHref,
  tweetIdOf,
  TWEET_SELECTOR,
  tweetsIn,
} from "./tweets.ts"

const article = (href: string): string =>
  `<article data-testid="tweet"><a href="/user/status/${href}">link</a></article>`

const mustQuery = (doc: Document, selector: string): Element => {
  const found = doc.querySelector(selector)
  if (!found) throw new Error(`fixture: ${selector} not found`)
  return found
}

const noop = (): void => undefined

describe("tweetIdFromHref", () => {
  test("extracts the trailing status id", () => {
    expect(tweetIdFromHref("/user/status/123456")).toBe("123456")
    expect(tweetIdFromHref("https://x.com/u/status/42/photo/1")).toBe("42")
    expect(tweetIdFromHref("/home")).toBeUndefined()
  })
})

describe("tweetsIn", () => {
  test("collects articles with status links and skips the rest", () => {
    const dom = new JSDOM(
      `<!doctype html><body><main role="main">${article("111")}<article data-testid="tweet">no link</article>${article("222")}</main></body>`
    )
    const found = tweetsIn(dom.window.document)
    expect(found.map(({ id }) => id)).toEqual(["111", "222"])
    expect(dom.window.document.querySelectorAll(TWEET_SELECTOR).length).toBe(3)
  })

  test("tweetIdOf reads the first status link", () => {
    const dom = new JSDOM(`<!doctype html><body>${article("999")}</body>`)
    expect(tweetIdOf(mustQuery(dom.window.document, "article"))).toBe("999")
  })
})

describe("ensurePill", () => {
  test("renders the pill once with the bookmark color", () => {
    const dom = new JSDOM(
      `<!doctype html><body><main role="main"></main></body>`
    )
    const doc = dom.window.document
    const slot = mustQuery(doc, "main")
    const first = ensurePill(slot, noop)
    const second = ensurePill(slot, noop)
    expect(first).toBe(second)
    expect(first.textContent).toBe(PILL_TEXT)
    expect(first.getAttribute("style") ?? "").toContain(PILL_TEXT_COLOR)
    expect(first.hasAttribute(`data-${PILL_MARKER.toLowerCase()}`)).toBe(true)
    expect(slot.querySelectorAll("button").length).toBe(1)
  })

  test("removePill clears the pill", () => {
    const dom = new JSDOM(
      `<!doctype html><body><main role="main"></main></body>`
    )
    const doc = dom.window.document
    ensurePill(mustQuery(doc, "main"), noop)
    removePill(doc)
    expect(mustQuery(doc, "main").querySelector("button")).toBeNull()
  })

  test("pill lands before the first feed cell", () => {
    const dom = new JSDOM(
      `<!doctype html><body><div data-testid="primaryColumn"><div role="tablist"></div><div><div data-testid="cellInnerDiv">a</div></div></div></body>`
    )
    const doc = dom.window.document
    const pill = ensurePill(
      mustQuery(doc, '[data-testid="primaryColumn"]'),
      noop
    )
    const cell = mustQuery(doc, '[data-testid="cellInnerDiv"]')
    expect(pill.nextSibling).toBe(cell)
  })

  test("reuses the pill when the slot changes under it", () => {
    const dom = new JSDOM(
      `<!doctype html><body><main role="main"></main><div data-testid="primaryColumn"></div></body>`
    )
    const doc = dom.window.document
    const first = ensurePill(mustQuery(doc, "main"), noop)
    const second = ensurePill(
      mustQuery(doc, '[data-testid="primaryColumn"]'),
      noop
    )
    expect(second).toBe(first)
    expect(doc.querySelectorAll("button").length).toBe(1)
  })

  test("pill moves before the first cell once the feed renders", () => {
    const dom = new JSDOM(
      `<!doctype html><body><div data-testid="primaryColumn"></div></body>`
    )
    const doc = dom.window.document
    const slot = mustQuery(doc, '[data-testid="primaryColumn"]')
    const first = ensurePill(slot, noop)
    expect(slot.firstElementChild).toBe(first)
    slot.insertAdjacentHTML(
      "beforeend",
      `<div><div data-testid="cellInnerDiv">a</div></div>`
    )
    const moved = ensurePill(slot, noop)
    expect(moved).toBe(first)
    expect(moved.nextElementSibling).toBe(
      mustQuery(doc, '[data-testid="cellInnerDiv"]')
    )
  })

  test("pill follows the tablist when the feed is empty", () => {
    const dom = new JSDOM(
      `<!doctype html><body><div data-testid="primaryColumn"><div><div role="tablist"></div></div></div></body>`
    )
    const doc = dom.window.document
    const pill = ensurePill(
      mustQuery(doc, '[data-testid="primaryColumn"]'),
      noop
    )
    const tabs = mustQuery(doc, '[role="tablist"]')
    expect(tabs.nextSibling).toBe(pill)
  })
})
