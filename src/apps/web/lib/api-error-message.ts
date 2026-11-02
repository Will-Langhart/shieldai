/**
 * Message for a non-ok API response: the server's `error` string when it sent
 * one, otherwise `Failed to <action> (<status>)`.
 */
export function apiErrorMessage(body: unknown, status: number, action: string): string {
  if (body !== null && typeof body === 'object') {
    const error = (body as { error?: unknown }).error;
    if (typeof error === 'string' && error !== '') {
      return error;
    }
  }
  return `Failed to ${action} (${status})`;
}
