import { expect, test } from "bun:test"
import { JSDOM } from "jsdom"

import { contrastRatio, thresholds } from "@openbunny/theme/contrast"
import { color, font } from "@openbunny/theme/tokens"

import { ensurePill, PILL_GROUND_COLOR, PILL_TEXT_COLOR } from "./pill.ts"

const pillStyle = (): string => {
  const dom = new JSDOM(`<!doctype html><body><main role="main"></main></body>`)
  const slot = dom.window.document.querySelector("main")
  if (!slot) throw new Error("fixture: main not found")
  return ensurePill(slot, () => undefined).getAttribute("style") ?? ""
}

test("every color in the pill style is a theme token", () => {
  const found = pillStyle().match(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)/gi) ?? []
  expect(found.length).toBeGreaterThan(0)
  const tokens: readonly string[] = Object.values(color)
  for (const literal of found) expect(tokens).toContain(literal)
})

test("the pill font stack is the theme stack, ending in the generic family", () => {
  expect(pillStyle()).toContain(`font-family:${font.sans}`)
  expect(font.sans.endsWith("monospace")).toBe(true)
})

test("the pill text meets the body contrast minimum on its own ground", () => {
  expect(
    contrastRatio(PILL_TEXT_COLOR, PILL_GROUND_COLOR)
  ).toBeGreaterThanOrEqual(thresholds.body)
})
