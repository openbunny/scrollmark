declare namespace browser.storage {
  interface StorageChange {
    oldValue?: unknown
    newValue?: unknown
  }
  interface LocalStorageArea {
    get(keys: string[]): Promise<Record<string, unknown>>
    get(keys: null): Promise<Record<string, unknown>>
    set(items: Record<string, unknown>): Promise<void>
    remove(keys: string[]): Promise<void>
  }
  const local: LocalStorageArea
  const onChanged: {
    addListener(
      callback: (
        changes: Record<string, StorageChange>,
        areaName: string
      ) => void
    ): void
  }
}
