import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import App from './App.tsx'

function renderAt(path: string) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('App', () => {
  it('renders the onboarding home screen', () => {
    renderAt('/')

    expect(
      screen.getByRole('heading', { name: /dein wissen/i }),
    ).toBeInTheDocument()
  })

  it('jumps into the application flow from "Los geht\'s"', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () =>
        Response.json({
          version: 'test',
          response_scale: { min: 1, max: 5, labels: [] },
          categories: [],
          questions: [],
        }),
      ),
    )
    const user = userEvent.setup()
    renderAt('/')

    await user.click(screen.getByRole('button', { name: /los geht's/i }))

    expect(
      await screen.findByRole('heading', { name: /learning with/i }),
    ).toBeInTheDocument()
    vi.unstubAllGlobals()
  })

  it('renders the application form at /application', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () =>
        Response.json({
          version: 'test',
          response_scale: { min: 1, max: 5, labels: [] },
          categories: [],
          questions: [],
        }),
      ),
    )
    renderAt('/application')

    expect(
      await screen.findByRole('heading', { name: /learning with/i }),
    ).toBeInTheDocument()
    vi.unstubAllGlobals()
  })

  it('renders the build playground at /playground', () => {
    renderAt('/playground')

    expect(
      screen.getByRole('heading', { name: 'Build playground' }),
    ).toBeInTheDocument()
  })
})
