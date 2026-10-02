const observedRoots = new WeakMap<Node, () => void>()

const isDocument = (node: Node): node is Document =>
  node.nodeType === node.DOCUMENT_NODE

export const observeMutations = (
  root: Node,
  callback: () => void
): (() => void) => {
  const existing = observedRoots.get(root)
  if (existing) return existing

  let scheduled = false
  const schedule = (): void => {
    if (scheduled) return
    scheduled = true
    queueMicrotask(() => {
      scheduled = false
      callback()
    })
  }
  const view =
    root.ownerDocument?.defaultView ??
    (isDocument(root) ? root.defaultView : null)
  if (!view) throw new Error("observeMutations: root has no owner window")
  const observer = new view.MutationObserver(schedule)
  observer.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["aria-selected"],
  })

  const stop = (): void => {
    observer.disconnect()
    observedRoots.delete(root)
  }
  observedRoots.set(root, stop)
  return stop
}
