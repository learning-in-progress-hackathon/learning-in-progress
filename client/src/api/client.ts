export class ApiError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  timeoutMs?: number
}

// Sends a JSON request to /api and returns the parsed response.
export async function request<T>(
  path: string,
  { method = 'GET', body, timeoutMs = 30_000 }: RequestOptions = {},
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (error) {
    throw toApiError(error)
  }

  if (!response.ok) {
    const data: { detail?: unknown } = await response.json().catch(() => ({}))
    const message =
      typeof data.detail === 'string'
        ? data.detail
        : `Request failed with status ${response.status}.`
    throw new ApiError(message, response.status)
  }

  // Empty bodies, e.g. 204 No Content, come back as null.
  const data: T = JSON.parse((await response.text()) || 'null')
  return data
}

export type StreamOptions = {
  body: unknown
  timeoutMs?: number
  onEvent: (event: string, data: unknown) => void
}

// POSTs JSON to /api and calls onEvent for each server-sent event, for endpoints that report progress while they work.
// Resolves when the server closes the stream; errors thrown by onEvent stop reading and reject.
export async function streamRequest(
  path: string,
  { body, timeoutMs = 900_000, onEvent }: StreamOptions,
): Promise<void> {
  let response: Response
  try {
    response = await fetch(`/api${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (error) {
    throw toApiError(error)
  }

  if (!response.ok || !response.body) {
    const data: { detail?: unknown } = await response.json().catch(() => ({}))
    const message =
      typeof data.detail === 'string'
        ? data.detail
        : `Request failed with status ${response.status}.`
    throw new ApiError(message, response.status)
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ''
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) return
      buffer += value
      // Events are separated by a blank line; keep any unfinished one for the next read.
      const blocks = buffer.split('\n\n')
      buffer = blocks.pop() ?? ''
      for (const block of blocks) {
        const lines = block.split('\n')
        const event = lines.find((line) => line.startsWith('event: '))
        const data = lines.find((line) => line.startsWith('data: '))
        if (event && data) onEvent(event.slice(7), JSON.parse(data.slice(6)))
      }
    }
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw toApiError(error)
  } finally {
    reader.releaseLock()
  }
}

function toApiError(error: unknown): ApiError {
  if (error instanceof DOMException && error.name === 'TimeoutError') {
    return new ApiError('The request timed out.')
  }
  return new ApiError('Could not reach the server.')
}
