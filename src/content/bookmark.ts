export interface Bookmark {
  readonly tweetId: string
  readonly seenAt: string
}

export interface Box {
  readonly top: number
  readonly bottom: number
}

export const BOOKMARK_PREFIX = "bookmark."

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

export const parseBookmark = (value: unknown): Bookmark | undefined => {
  if (!isRecord(value)) return undefined
  const { tweetId, seenAt } = value
  if (typeof tweetId !== "string" || !/^\d+$/.test(tweetId)) return undefined
  if (typeof seenAt !== "string") return undefined
  return { tweetId, seenAt }
}

export const pickFirstVisible = (boxes: readonly Box[]): number => {
  let aboveFallback = -1
  let aboveBottom = Number.NEGATIVE_INFINITY
  let index = 0
  for (const box of boxes) {
    if (box.bottom <= 0) {
      if (box.bottom > aboveBottom) {
        aboveBottom = box.bottom
        aboveFallback = index
      }
    } else {
      return index
    }
    index += 1
  }
  return aboveFallback
}
