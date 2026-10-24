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

  it('walks through the first onboarding question', async () => {
    const user = userEvent.setup()
    renderAt('/')

    await user.click(screen.getByRole('button', { name: /los geht's/i }))

    expect(screen.getByText(/wann fühlt sich lernen/i)).toBeInTheDocument()
  })

  it('renders the build playground at /playground', () => {
    renderAt('/playground')

    expect(
      screen.getByRole('heading', { name: 'Build playground' }),
    ).toBeInTheDocument()
  })
})
