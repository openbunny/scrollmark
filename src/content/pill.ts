import {
  borderWidth,
  color,
  font,
  fontWeight,
  radius,
  space,
  text,
} from "@openbunny/theme/tokens"

export const PILL_MARKER = "scrollmarkJump"
export const PILL_TEXT = "jump to bookmark"
export const PILL_TEXT_COLOR: string = color.foreground
export const PILL_GROUND_COLOR: string = color.paper

const CELL_SELECTOR = 'div[data-testid="cellInnerDiv"]'
const TABLIST_SELECTOR = '[role="tablist"]'

const pillCss = (foreground: string, ground: string): string =>
  [
    "display:flex",
    "justify-content:center",
    "width:100%",
    `padding:${space["3"]} ${space["4"]}`,
    "border:0",
    `border-bottom:${borderWidth} solid ${color.line}`,
    `border-radius:${String(radius.sm)}px`,
    `background:${ground}`,
    `font-family:${font.sans}`,
    `font-size:${text.body}`,
    `font-weight:${String(fontWeight.regular)}`,
    `color:${foreground}`,
    "cursor:pointer",
  ].join(";")

export const findPillSlot = (doc: Document): Element | undefined => {
  const column = doc.querySelector('[data-testid="primaryColumn"]')
  if (column) return column
  return doc.querySelector('main[role="main"]') ?? undefined
}

const pillSelector = (): string => `button[data-${PILL_MARKER.toLowerCase()}]`

const makePill = (doc: Document, onJump: () => void): HTMLButtonElement => {
  const pill = doc.createElement("button")
  pill.setAttribute(`data-${PILL_MARKER.toLowerCase()}`, "1")
  pill.textContent = PILL_TEXT
  pill.setAttribute("style", pillCss(PILL_TEXT_COLOR, PILL_GROUND_COLOR))
  pill.addEventListener("click", onJump)
  return pill
}

export const ensurePill = (
  slot: Element,
  onJump: () => void
): HTMLButtonElement => {
  const doc = slot.ownerDocument
  const pill =
    slot.querySelector<HTMLButtonElement>(pillSelector()) ??
    doc.querySelector<HTMLButtonElement>(pillSelector()) ??
    makePill(doc, onJump)
  const cell = slot.querySelector(CELL_SELECTOR)
  if (cell?.parentElement) {
    if (pill.nextElementSibling !== cell)
      cell.parentElement.insertBefore(pill, cell)
    return pill
  }
  const tabs = slot.querySelector(TABLIST_SELECTOR)
  if (tabs?.parentElement) {
    if (pill.previousElementSibling !== tabs)
      tabs.parentElement.insertBefore(pill, tabs.nextSibling)
    return pill
  }
  if (pill.parentElement !== slot) slot.prepend(pill)
  return pill
}

export const removePill = (scope: ParentNode): void => {
  scope.querySelector(pillSelector())?.remove()
}
