export interface NavigationWindow {
  readonly history: History
  readonly document: Document
  readonly Event: typeof Event
  addEventListener(type: "popstate", listener: () => void): void
}

const NAVIGATION_EVENT = "scrollmark:navigate"
const patchedWindows = new WeakSet<NavigationWindow>()

const patchHistoryOnce = (win: NavigationWindow): void => {
  if (patchedWindows.has(win)) return
  patchedWindows.add(win)
  const notify = (): void => {
    win.document.dispatchEvent(new win.Event(NAVIGATION_EVENT))
  }

  const originalPush = win.history.pushState.bind(win.history)
  win.history.pushState = (...args: Parameters<History["pushState"]>) => {
    originalPush(...args)
    notify()
  }

  const originalReplace = win.history.replaceState.bind(win.history)
  win.history.replaceState = (...args: Parameters<History["replaceState"]>) => {
    originalReplace(...args)
    notify()
  }

  win.addEventListener("popstate", notify)
}

export const onNavigate = (
  callback: () => void,
  win: NavigationWindow = window
): (() => void) => {
  patchHistoryOnce(win)
  win.document.addEventListener(NAVIGATION_EVENT, callback)
  return () => win.document.removeEventListener(NAVIGATION_EVENT, callback)
}
