import { ApiError, request, streamRequest } from './client'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status })
}

function stubFetch() {
  const fetchMock = vi.fn<typeof fetch>()
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('request', () => {
  it('returns the parsed JSON response', async () => {
    stubFetch().mockResolvedValue(json({ ok: true }))

    expect(await request('/thing')).toEqual({ ok: true })
  })

  it('returns null for an empty response', async () => {
    stubFetch().mockResolvedValue(new Response(null, { status: 204 }))

    expect(await request('/thing', { method: 'DELETE' })).toBeNull()
  })

  it('throws the server detail message on errors', async () => {
    stubFetch().mockResolvedValue(json({ detail: 'Bad input' }, 400))

    await expect(request('/thing')).rejects.toEqual(
      new ApiError('Bad input', 400),
    )
  })

  it('times out slow requests', async () => {
    stubFetch().mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('Timed out', 'TimeoutError')),
          )
        }),
    )

    await expect(request('/thing', { timeoutMs: 10 })).rejects.toEqual(
      new ApiError('The request timed out.'),
    )
  })

  it('reports an unreachable server', async () => {
    stubFetch().mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(request('/thing')).rejects.toEqual(
      new ApiError('Could not reach the server.'),
    )
  })
})

describe('streamRequest', () => {
  it('calls onEvent for each event, even when split across chunks', async () => {
    const chunks = [
      'event: status\ndata: {"text":"Thin',
      'king…"}\n\nevent: done\ndata: {"html":"<p>Hi</p>"}\n\n',
    ]
    const body = new ReadableStream({
      start(controller) {
        for (const chunk of chunks)
          controller.enqueue(new TextEncoder().encode(chunk))
        controller.close()
      },
    })
    stubFetch().mockResolvedValue(new Response(body))
    const onEvent = vi.fn<(event: string, data: unknown) => void>()

    await streamRequest('/thing', { body: {}, onEvent })

    expect(onEvent.mock.calls).toEqual([
      ['status', { text: 'Thinking…' }],
      ['done', { html: '<p>Hi</p>' }],
    ])
  })

  it('throws the server detail message on errors', async () => {
    stubFetch().mockResolvedValue(json({ detail: 'Bad input' }, 422))

    await expect(
      streamRequest('/thing', { body: {}, onEvent: vi.fn<() => void>() }),
    ).rejects.toEqual(new ApiError('Bad input', 422))
  })

  it('reports an unreachable server', async () => {
    stubFetch().mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(
      streamRequest('/thing', { body: {}, onEvent: vi.fn<() => void>() }),
    ).rejects.toEqual(new ApiError('Could not reach the server.'))
  })
})
