import { act, render, screen } from '@testing-library/react'
import { HermesProgress, formatElapsed } from './HermesProgress'

afterEach(() => {
  vi.useRealTimers()
})

describe('HermesProgress', () => {
  it('shows the status and counts up the time while it runs', () => {
    vi.useFakeTimers()
    render(<HermesProgress status="🔍 web_search" reasoning="" />)

    expect(screen.getByText('🔍 web_search')).toBeInTheDocument()
    expect(screen.getByText('0:00')).toBeInTheDocument()

    act(() => {
      void vi.advanceTimersByTime(83_000)
    })

    expect(screen.getByText('1:23')).toBeInTheDocument()
  })

  it('shows the reasoning in a box', () => {
    render(<HermesProgress status="" reasoning="First the research." />)

    expect(screen.getByLabelText('Hermes reasoning')).toHaveTextContent(
      'First the research.',
    )
  })
})

describe('formatElapsed', () => {
  it('formats milliseconds as m:ss', () => {
    expect(formatElapsed(0)).toBe('0:00')
    expect(formatElapsed(9_999)).toBe('0:09')
    expect(formatElapsed(488_000)).toBe('8:08')
  })
})
