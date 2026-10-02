import { pickFirstVisible, type Bookmark, type Box } from "./bookmark.ts"
import { onNavigate, type NavigationWindow } from "./navigate.ts"
import { observeMutations } from "./observe.ts"
import { ensurePill, findPillSlot, removePill } from "./pill.ts"
import { readBookmark, type StorageArea, writeBookmark } from "./store.ts"
import { bookmarkKey, parseRoute } from "./tabs.ts"
import { scrollTweetIntoView, tweetsIn } from "./tweets.ts"

const started = new WeakSet<Document>()
const SCAN_INTERVAL_MS = 500
const JUMP_TIMEOUT_MS = 8000
const JUMP_POLL_MS = 250

const boxesOf = (root: ParentNode): { boxes: Box[]; ids: string[] } => {
  const tweets = tweetsIn(root)
  return {
    boxes: tweets.map(({ node }) => {
      const rect = node.getBoundingClientRect()
      return { top: rect.top, bottom: rect.bottom }
    }),
    ids: tweets.map(({ id }) => id),
  }
}

const scrollToTweet = (root: ParentNode, tweetId: string): boolean => {
  for (const { id, node } of tweetsIn(root)) {
    if (id !== tweetId) continue
    scrollTweetIntoView(node)
    return true
  }
  return false
}

const nearestSurviving = (
  ids: readonly string[],
  tweetId: string
): string | undefined => {
  const at = ids.indexOf(tweetId)
  if (at < 0) return ids[0]
  return ids[at] ?? ids[at - 1] ?? ids[0]
}

export interface StartView extends NavigationWindow {
  readonly location: { readonly href: string }
  addEventListener(type: "popstate", listener: () => void): void
  addEventListener(
    type: "scroll",
    listener: () => void,
    options?: { readonly passive: boolean }
  ): void
  removeEventListener(type: "scroll", listener: () => void): void
}

export const startMarks = (
  doc: Document = document,
  storage: StorageArea = browser.storage.local,
  view: StartView = window,
  now: () => number = Date.now
): (() => void) => {
  if (started.has(doc)) return () => undefined
  started.add(doc)

  let key: string | undefined
  let mark: Bookmark | undefined
  let lastWrite = ""
  let lastScan = 0
  let stopMutations: (() => void) | undefined

  const selectedTabLabel = (): string | undefined =>
    doc.querySelector('[role="tablist"] [role="tab"][aria-selected="true"]')
      ?.textContent ?? undefined

  const root = (): ParentNode => findPillSlot(doc) ?? doc.body

  let slot: Element = doc.body

  const syncPill = (): void => {
    if (!key || !mark) {
      removePill(doc)
      return
    }
    ensurePill(slot, () => void jump())
  }

  const record = async (): Promise<void> => {
    if (!key) return
    const { boxes, ids } = boxesOf(root())
    const at = pickFirstVisible(boxes)
    const id = at >= 0 ? ids[at] : undefined
    if (id === undefined || id === lastWrite) return
    lastWrite = id
    const next: Bookmark = {
      tweetId: id,
      seenAt: new Date(now()).toISOString(),
    }
    mark = next
    await writeBookmark(storage, key, next)
    syncPill()
  }

  const recordThrottled = (): void => {
    const at = now()
    if (at - lastScan < SCAN_INTERVAL_MS) return
    lastScan = at
    void record()
  }

  const jump = async (): Promise<void> => {
    if (!mark) return
    const target = mark.tweetId
    const deadline = now() + JUMP_TIMEOUT_MS
    while (now() < deadline) {
      if (scrollToTweet(root(), target)) return
      const { ids } = boxesOf(root())
      const fallback = nearestSurviving(ids, target)
      if (fallback !== undefined && scrollToTweet(root(), fallback)) return
      await new Promise((resolve) => setTimeout(resolve, JUMP_POLL_MS))
    }
  }

  const attach = (): void => {
    stopMutations?.()
    const route = parseRoute(new URL(view.location.href), selectedTabLabel())
    key = bookmarkKey(route)
    mark = undefined
    lastWrite = ""
    slot = findPillSlot(doc) ?? doc.body
    removePill(doc)
    if (!key) return
    const activeKey = key
    void readBookmark(storage, activeKey).then((stored) => {
      mark = stored
      lastWrite = stored?.tweetId ?? ""
      syncPill()
      return undefined
    })
    stopMutations = observeMutations(slot, () => {
      const next = parseRoute(new URL(view.location.href), selectedTabLabel())
      const nextKey = bookmarkKey(next)
      if (nextKey !== key) {
        attach()
        return
      }
      const now = findPillSlot(doc) ?? doc.body
      if (now !== slot) {
        attach()
        return
      }
      syncPill()
    })
  }

  view.addEventListener("scroll", recordThrottled, { passive: true })
  const stopNav = onNavigate(attach, view)
  attach()

  return () => {
    stopMutations?.()
    stopNav()
    view.removeEventListener("scroll", recordThrottled)
  }
}
