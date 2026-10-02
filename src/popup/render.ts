import {
  borderWidth,
  color,
  font,
  fontWeight,
  radius,
  space,
  text,
} from "@openbunny/theme/tokens"

import {
  clearBookmarks,
  countBookmarks,
  type PruneStorageArea,
} from "../content/prune.ts"

const bodyCss = [
  `padding:${space["4"]}`,
  `background:${color.paper}`,
  `color:${color.foreground}`,
  `font-family:${font.sans}`,
  `font-size:${text.body}`,
  `font-weight:${String(fontWeight.regular)}`,
].join(";")

const buttonCss = [
  `padding:${space["2"]} ${space["3"]}`,
  `border:${borderWidth} solid ${color.line}`,
  `border-radius:${String(radius.sm)}px`,
  `background:${color.paper}`,
  `color:${color.foreground}`,
  "font:inherit",
  "cursor:pointer",
].join(";")

export const statusText = (count: number): string =>
  count === 0
    ? "no saved bookmarks"
    : `${String(count)} saved ${count === 1 ? "bookmark" : "bookmarks"}`

export const renderPopup = async (
  doc: Document,
  storage: PruneStorageArea
): Promise<void> => {
  const status = doc.createElement("p")
  const clear = doc.createElement("button")
  clear.textContent = "clear saved bookmarks"
  doc.body.style.cssText = bodyCss
  status.style.cssText = `margin-block:${space["3"]}`
  clear.style.cssText = buttonCss
  const show = async (): Promise<void> => {
    const count = await countBookmarks(storage)
    status.textContent = statusText(count)
    clear.disabled = count === 0
  }
  clear.addEventListener("click", () => {
    void clearBookmarks(storage).then(show)
  })
  doc.body.replaceChildren(status, clear)
  await show()
}
