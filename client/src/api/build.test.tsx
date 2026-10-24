import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useBuildPage, type BuildInput } from './build'

const input: BuildInput = {
  profile: {
    name: 'Peter',
    challenges: ['ADHD'],
    goals: '',
    interests: [],
    whatWorks: '',
  },
  answers: [{ question: 'Reading or doing?', answer: 'Doing' }],
  material: 'Osmosis',
}

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  )
}

function sse(...events: [string, unknown][]) {
  return new Response(
    events
      .map(
        ([event, data]) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
      )
      .join(''),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useBuildPage', () => {
  it('posts the input, reports progress, and returns the page', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        sse(
          ['status', { text: 'Thinking…' }],
          ['done', { html: '<!doctype html><html></html>' }],
        ),
      )
    vi.stubGlobal('fetch', fetchMock)
    const { result } = renderHook(() => useBuildPage(), { wrapper })

    act(() => result.current.mutate(input))

    await waitFor(() =>
      expect(result.current.data).toEqual({
        html: '<!doctype html><html></html>',
      }),
    )
    expect(result.current.status).toBe('Thinking…')
    expect(fetchMock.mock.calls[0][0]).toBe('/api/build')
    expect(fetchMock.mock.calls[0][1]?.body).toBe(JSON.stringify(input))
  })

  it('fails with the message from an error event', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          sse(['error', { message: 'Hermes stopped responding. Try again.' }]),
        ),
    )
    const { result } = renderHook(() => useBuildPage(), { wrapper })

    act(() => result.current.mutate(input))

    await waitFor(() =>
      expect(result.current.error?.message).toBe(
        'Hermes stopped responding. Try again.',
      ),
    )
  })

  it('fails when the stream ends without a page', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(sse(['status', { text: 'Thinking…' }])),
    )
    const { result } = renderHook(() => useBuildPage(), { wrapper })

    act(() => result.current.mutate(input))

    await waitFor(() =>
      expect(result.current.error?.message).toBe(
        'The build stopped before the page was ready.',
      ),
    )
  })
})
