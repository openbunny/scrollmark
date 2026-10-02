import { pruneBookmarks } from "./prune.ts"
import { startMarks } from "./start.ts"

if (typeof document !== "undefined") {
  void pruneBookmarks(browser.storage.local).then(() => startMarks())
}
