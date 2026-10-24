import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Playground } from './Playground'
import { mockStudent } from './mockStudent'

function renderApp() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <Playground />
    </QueryClientProvider>,
  )
}

function stubFetch(response: Response) {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const buildButton = { name: 'Build learning page' }

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Playground', () => {
  it('starts with the mock student in the box', () => {
    renderApp()

    expect(screen.getByLabelText('Student data')).toHaveValue(
      JSON.stringify(mockStudent, null, 2),
    )
  })

  it('sends the student data and shows the page in a sandboxed frame', async () => {
    const html = '<!doctype html><html><body>Osmose</body></html>'
    const fetchMock = stubFetch(
      new Response(`event: done\ndata: ${JSON.stringify({ html })}\n\n`),
    )
    renderApp()

    await userEvent.click(screen.getByRole('button', buildButton))

    const frame = await screen.findByTitle('Your learning page')
    expect(frame).toHaveAttribute('sandbox', 'allow-scripts')
    expect(frame).toHaveAttribute('srcdoc', html)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/build')
    expect(fetchMock.mock.calls[0][1]?.body).toBe(JSON.stringify(mockStudent))

    await userEvent.click(screen.getByRole('button', { name: 'Back' }))

    expect(screen.getByRole('button', buildButton)).toBeInTheDocument()
  })

  it('does not send invalid JSON', async () => {
    const fetchMock = stubFetch(new Response('{}'))
    renderApp()

    fireEvent.change(screen.getByLabelText('Student data'), {
      target: { value: '{ not json' },
    })
    await userEvent.click(screen.getByRole('button', buildButton))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'The student data is not valid JSON.',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows the server error', async () => {
    stubFetch(
      new Response(
        JSON.stringify({ detail: 'Hermes did not return a page. Try again.' }),
        { status: 502 },
      ),
    )
    renderApp()

    await userEvent.click(screen.getByRole('button', buildButton))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Hermes did not return a page. Try again.',
    )
  })
})
