import { BOOKMARK_PREFIX } from "./bookmark.ts"

export const PROFILE_TABS = [
  "posts",
  "replies",
  "reposts",
  "subs",
  "media",
  "articles",
] as const

export type ProfileTab = (typeof PROFILE_TABS)[number]

export type Route =
  | {
      readonly kind: "profile"
      readonly handle: string
      readonly tab: ProfileTab
    }
  | { readonly kind: "other" }

export const DEFAULT_TAB: ProfileTab = "posts"

const PROFILE_TAB_BY_SLUG: Record<string, ProfileTab> = {
  "": "posts",
  with_replies: "replies",
  media: "media",
  likes: "articles",
}

const KNOWN_PROFILE_SEGMENTS: ReadonlySet<string> = new Set([
  "with_replies",
  "media",
  "likes",
  "reposts",
  "subs",
  "articles",
  "highlights",
])

const RESERVED: ReadonlySet<string> = new Set([
  "home",
  "explore",
  "notifications",
  "messages",
  "bookmarks",
  "lists",
  "communities",
  "settings",
  "search",
  "i",
])

const PROFILE_TAB_SET: ReadonlySet<string> = new Set(PROFILE_TABS)

const isProfileTab = (label: string): label is ProfileTab =>
  PROFILE_TAB_SET.has(label)

export const profileTabFromDom = (
  selectedLabel: string | undefined
): ProfileTab | undefined => {
  if (!selectedLabel) return undefined
  const label = selectedLabel.trim().toLowerCase()
  return isProfileTab(label) ? label : undefined
}

export const parseRoute = (url: URL, selectedTabLabel?: string): Route => {
  const segments = url.pathname.split("/").filter((part) => part.length > 0)
  const [head, rest] = segments
  if (head === undefined) return { kind: "other" }
  if (RESERVED.has(head.toLowerCase())) return { kind: "other" }
  if (segments.length > 2) return { kind: "other" }
  if (rest !== undefined) {
    const slug = rest.toLowerCase()
    if (!KNOWN_PROFILE_SEGMENTS.has(slug)) {
      const domTab = profileTabFromDom(selectedTabLabel)
      if (domTab === undefined || slug !== domTab) return { kind: "other" }
      return { kind: "profile", handle: head, tab: domTab }
    }
    const tab = profileTabFromDom(selectedTabLabel) ?? PROFILE_TAB_BY_SLUG[slug]
    if (tab === undefined) return { kind: "other" }
    return { kind: "profile", handle: head, tab }
  }
  return {
    kind: "profile",
    handle: head,
    tab: profileTabFromDom(selectedTabLabel) ?? DEFAULT_TAB,
  }
}

export const bookmarkKey = (route: Route): string | undefined => {
  if (route.kind === "profile")
    return `${BOOKMARK_PREFIX}${route.handle.toLowerCase()}.${route.tab}`
  return undefined
}
