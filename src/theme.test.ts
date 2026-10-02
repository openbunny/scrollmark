import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

import { color } from "@openbunny/theme/tokens"

const icon = readFileSync(
  new URL("../artwork/app-icon.svg", import.meta.url),
  "utf8"
)

test("every fill in the app icon is a theme color", () => {
  const fills = [...icon.matchAll(/fill="(#[0-9a-f]{6})"/gi)].map(
    (match) => match[1] ?? ""
  )
  expect(fills.length).toBeGreaterThan(0)
  const tokens: readonly string[] = Object.values(color)
  for (const fill of fills) expect(tokens).toContain(fill)
})

test("the app icon uses at least two theme colors", () => {
  expect(new Set(icon.match(/#[0-9a-f]{6}/gi)).size).toBeGreaterThanOrEqual(2)
})
