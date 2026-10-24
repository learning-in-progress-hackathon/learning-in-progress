import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { loadRun } from '@/features/learn/learnStore'
import { Playground } from './Playground'
import { mockStudent } from './mockStudent'

function renderApp() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <Playground />
    </QueryClientProvider>,
  )
}

function sse(event: string, data: unknown) {
  return new Response(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

const question = {
  done: false,
  question: 'Reading or listening?',
  options: ['Reading', 'Listening'],
  themes: [],
}
const finished = {
  done: true,
  question: '',
  options: [],
  themes: [{ theme: 'read-aloud', reason: 'You like listening.' }],
}
const answers = [{ question: 'Reading or listening?', answer: 'Listening' }]
const startButton = { name: 'Start assessment' }

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Playground', () => {
  it('starts with the mock profile and material in the boxes', () => {
    renderApp()

    expect(screen.getByLabelText('Student profile')).toHaveValue(
      JSON.stringify(mockStudent.profile, null, 2),
    )
    expect(screen.getByLabelText('Learning material')).toHaveValue(
      mockStudent.material,
    )
  })

  it('asks questions until done, then opens the pages in a new tab', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(sse('done', question))
      .mockResolvedValueOnce(sse('done', finished))
    const openMock = vi.fn<(url: string | URL, target?: string) => void>()
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('open', openMock)
    renderApp()

    await userEvent.click(screen.getByRole('button', startButton))
    await userEvent.click(
      await screen.findByRole('button', { name: 'Listening' }),
    )
    expect(await screen.findByText(/You like listening/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Generate' }))

    expect(fetchMock.mock.calls[1][1]?.body).toBe(
      JSON.stringify({ profile: mockStudent.profile, answers }),
    )
    const [url, target] = openMock.mock.calls[0]
    expect(target).toBe('_blank')
    expect(loadRun(String(url).replace('/learn/', ''))).toEqual({
      profile: mockStudent.profile,
      answers,
      material: mockStudent.material,
      themes: finished.themes,
    })
    expect(screen.getByText(/You like listening/)).toBeInTheDocument()
  })

  it('shows the error and retries with the same answers', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(
          sse('error', { message: "Hermes didn't answer. Try again." }),
        )
        .mockResolvedValueOnce(sse('done', question)),
    )
    renderApp()

    await userEvent.click(screen.getByRole('button', startButton))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Hermes didn't answer. Try again.",
    )
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(
      await screen.findByRole('button', { name: 'Listening' }),
    ).toBeInTheDocument()
  })

  it('does not start with invalid JSON', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)
    renderApp()

    fireEvent.change(screen.getByLabelText('Student profile'), {
      target: { value: '{ nope' },
    })
    await userEvent.click(screen.getByRole('button', startButton))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'The profile is not valid JSON.',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
