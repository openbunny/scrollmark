import { renderPopup } from "./render.ts"

if (typeof document !== "undefined") {
  void renderPopup(document, browser.storage.local)
}
