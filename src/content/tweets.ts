export const TWEET_SELECTOR = 'article[data-testid="tweet"]'
const STATUS_ID = /\/status\/(\d+)/

export interface TweetRef {
  readonly id: string
  readonly node: Element
}

export const tweetIdFromHref = (href: string): string | undefined => {
  const match = STATUS_ID.exec(href)
  return match?.[1]
}

export const tweetIdOf = (article: Element): string | undefined => {
  const links = article.querySelectorAll('a[href*="/status/"]')
  for (const link of links) {
    const id = tweetIdFromHref(link.getAttribute("href") ?? "")
    if (id) return id
  }
  return undefined
}

export const tweetsIn = (root: ParentNode): TweetRef[] => {
  const out: TweetRef[] = []
  for (const node of root.querySelectorAll(TWEET_SELECTOR)) {
    const id = tweetIdOf(node)
    if (id) out.push({ id, node })
  }
  return out
}

export const scrollTweetIntoView = (node: Element): void => {
  if (node instanceof HTMLElement) node.scrollIntoView({ block: "center" })
}
