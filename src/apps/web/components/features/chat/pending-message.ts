// Holds a signed-out user's message while they authenticate. sessionStorage
// (not state) so it survives the full-page OAuth redirect. Keep the key
// unchanged so a message saved before a deploy still sends after it.
export const PENDING_MESSAGE_KEY = 'shieldai-pending-message'

/** Saves the message; storage errors (private mode, quota) are ignored. */
export function savePendingMessage(
  storage: Pick<Storage, 'setItem'> | undefined,
  text: string
): void {
  try {
    storage?.setItem(PENDING_MESSAGE_KEY, text)
  } catch {}
}

/**
 * Reads and removes the saved message. Returns it only when it has
 * non-whitespace content; otherwise (or on any storage error) `null`.
 */
export function takePendingMessage(
  storage: Pick<Storage, 'getItem' | 'removeItem'> | undefined
): string | null {
  if (!storage) return null
  let text: string | null = null
  try {
    text = storage.getItem(PENDING_MESSAGE_KEY)
    storage.removeItem(PENDING_MESSAGE_KEY)
  } catch {
    return null
  }
  return text && text.trim() ? text : null
}

/** Removes the saved message; storage errors are ignored. */
export function clearPendingMessage(
  storage: Pick<Storage, 'removeItem'> | undefined
): void {
  try {
    storage?.removeItem(PENDING_MESSAGE_KEY)
  } catch {}
}

/**
 * The browser's sessionStorage, or `undefined` during SSR or when the browser
 * blocks access to it (reading `sessionStorage` itself can throw).
 */
export function browserSessionStorage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.sessionStorage
  } catch {
    return undefined
  }
}
