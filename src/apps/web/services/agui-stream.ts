/**
 * Minimal AG-UI client: reads a `text/event-stream` response and hands each
 * decoded event to `onEvent`. No dependencies and no DOM APIs beyond fetch's
 * ReadableStream, so the iOS app can reuse it through expo/fetch.
 */

export interface AguiEvent {
  type: string
  [key: string]: any
}

export async function readAguiStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: AguiEvent) => void
): Promise<void> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  const flush = (block: string) => {
    // An SSE event is one or more `data:` lines; other fields (event/id/retry) are unused here.
    const data = block
      .split('\n')
      .filter(line => line.startsWith('data:'))
      .map(line => line.slice(5).replace(/^ /, ''))
      .join('\n')
    if (!data) return
    try {
      onEvent(JSON.parse(data))
    } catch {
      // A malformed frame shouldn't kill the rest of the answer.
    }
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n')
    let sep: number
    while ((sep = buffer.indexOf('\n\n')) !== -1) {
      flush(buffer.slice(0, sep))
      buffer = buffer.slice(sep + 2)
    }
  }
  buffer += decoder.decode()
  if (buffer.trim()) flush(buffer)
}
