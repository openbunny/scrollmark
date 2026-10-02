import { type Bookmark, parseBookmark } from "./bookmark.ts"

export interface StorageArea {
  get(keys: string[]): Promise<Record<string, unknown>>
  set(items: Record<string, unknown>): Promise<void>
}

export const readBookmark = async (
  storage: StorageArea,
  key: string
): Promise<Bookmark | undefined> =>
  parseBookmark((await storage.get([key]))[key])

export const writeBookmark = async (
  storage: StorageArea,
  key: string,
  mark: Bookmark
): Promise<void> => {
  await storage.set({ [key]: mark })
}
