import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { loadRun } from '@/features/learn/learnStore'
import type { Survey } from '@/lib/survey'
import { ApplicationForm } from './ApplicationForm'

// A small stand-in for GET /api/survey: two categories, five questions.
const survey: Survey = {
  version: 'test',
  response_scale: {
    min: 1,
    max: 5,
    labels: [
      'Not like me at all',
      'Not much like me',
      'Somewhat like me',
      'Quite like me',
      'Very much like me',
    ],
  },
  categories: [
    { id: 'prior_knowledge', title: 'What you already know', hint: '' },
    { id: 'working_memory', title: 'Keeping things in mind', hint: '' },
  ],
  questions: [
    {
      id: 'pk1',
      category: 'prior_knowledge',
      text: 'I know a lot.',
      priority: 'high',
    },
    {
      id: 'pk2',
      category: 'prior_knowledge',
      text: 'I could explain it.',
      priority: 'low',
    },
    {
      id: 'pk3',
      category: 'prior_knowledge',
      text: 'It is all new.',
      priority: 'high',
    },
    {
      id: 'wm1',
      category: 'working_memory',
      text: 'I forget steps.',
      priority: 'high',
    },
    {
      id: 'wm2',
      category: 'working_memory',
      text: 'I lose track.',
      priority: 'low',
    },
  ],
}

function renderForm() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <ApplicationForm />
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

function urlOf(input: RequestInfo | URL) {
  return input instanceof Request ? input.url : input.toString()
}

// Answers GET /api/survey with the survey above, POST /api/profile with `profileResponse`,
// and POST /api/assess with one question, then the picked themes.
function mockServer(profileResponse: Response = Response.json({})) {
  let assessCalls = 0
  const fetchMock = vi.fn<typeof fetch>(async (input) => {
    const url = urlOf(input)
    if (url === '/api/survey') return Response.json(survey)
    if (url === '/api/assess')
      return assessCalls++ === 0 ? sse('done', question) : sse('done', finished)
    return profileResponse
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

async function fillAboutAndGoal(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: /let’s start/i }))
  await user.type(screen.getByLabelText('What should we call you?'), 'Lina')
  await user.click(screen.getByRole('button', { name: 'School' }))
  await user.click(screen.getByRole('button', { name: /continue/i }))

  await user.type(screen.getByLabelText('What are you learning?'), 'Fractions')
  await user.click(screen.getByRole('button', { name: /continue/i }))
}

describe('ApplicationForm', () => {
  beforeEach(() => sessionStorage.clear())
  afterEach(() => vi.unstubAllGlobals())

  it('asks for a name and a stage before leaving the about step', async () => {
    mockServer()
    const user = userEvent.setup()
    renderForm()

    await user.click(
      await screen.findByRole('button', { name: /let’s start/i }),
    )
    await user.click(screen.getByRole('button', { name: /continue/i }))

    expect(screen.getByText('Tell us what to call you.')).toBeInTheDocument()
    expect(screen.getByText('Pick the one that fits best.')).toBeInTheDocument()
  })

  it('shows the questions from the server and asks for every answer in a part', async () => {
    mockServer()
    const user = userEvent.setup()
    renderForm()
    await fillAboutAndGoal(user)

    expect(screen.getByText('I know a lot.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /continue/i }))
    expect(
      screen.getByText('Answer each one, or skip this part for now.'),
    ).toBeInTheDocument()

    for (const group of screen.getAllByRole('group')) {
      const radios = group.querySelectorAll('input[type="radio"]')
      if (radios.length) await user.click(radios[0])
    }
    await user.click(screen.getByRole('button', { name: /continue/i }))
    expect(
      screen.getByRole('heading', { name: 'Keeping things in mind' }),
    ).toBeInTheDocument()
  })

  it('sends raw answers on "Build my tool", asks the questions, and opens the pages', async () => {
    const studentProfile = {
      scale_version: 'test',
      student: {
        name: 'Lina',
        stage: 'School',
        stage_detail: '',
        interests: '',
      },
      goal: { type: '', in_their_words: '' },
      material: {
        topic: 'Fractions',
        text: 'Halves and quarters.',
        files: [],
      },
      learning_instructions: { prior_knowledge: ['Skip the basics.'] },
      preferences: { likes_learning_with: [], notes: '' },
    }
    const fetchMock = mockServer(Response.json(studentProfile))
    const openMock = vi.fn<typeof window.open>()
    vi.stubGlobal('open', openMock)
    const user = userEvent.setup()
    renderForm()
    await fillAboutAndGoal(user)

    // Answer "Very much like me" on the first part, skip the second.
    for (const radio of screen.getAllByRole('radio', {
      name: /very much like me/i,
    })) {
      await user.click(radio)
    }
    await user.click(screen.getByRole('button', { name: /continue/i }))
    await user.click(screen.getByRole('button', { name: /skip this part/i }))
    await user.click(screen.getByRole('button', { name: 'Short videos' }))
    await user.click(screen.getByRole('button', { name: /continue/i }))

    expect(
      screen.getByRole('heading', { name: /does this sound like you/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('3 of 5 questions answered')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /build my tool/i }))

    // The client sends the raw answers only; scoring is the server's job.
    const bodyOf = (path: string) => {
      const call = fetchMock.mock.calls.find(([input]) => urlOf(input) === path)
      const sent = call?.[1]?.body
      return JSON.parse(typeof sent === 'string' ? sent : '{}')
    }
    const body = bodyOf('/api/profile')
    expect(body.answers).toEqual({ pk1: 5, pk2: 5, pk3: 5 })
    expect(body.material.topic).toBe('Fractions')

    expect(
      await screen.findByRole('heading', { name: /thanks, lina/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/"Skip the basics\."/)).toBeInTheDocument()

    // Hermes gets the profile without the pasted text.
    const hermesProfile = {
      ...studentProfile,
      material: { topic: 'Fractions', files: [] },
    }
    expect(bodyOf('/api/assess')).toEqual({
      profile: hermesProfile,
      answers: [],
    })

    await user.click(await screen.findByRole('button', { name: 'Listening' }))
    expect(await screen.findByText(/You like listening/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /generate/i }))

    const [url, target] = openMock.mock.calls[0]
    expect(target).toBe('_blank')
    expect(loadRun(String(url).replace('/learn/', ''))).toEqual({
      profile: hermesProfile,
      answers: [{ question: 'Reading or listening?', answer: 'Listening' }],
      material: 'Fractions\n\nHalves and quarters.',
      themes: finished.themes,
    })
  })

  it('skips the rest of the survey to the notes step', async () => {
    mockServer()
    const user = userEvent.setup()
    renderForm()
    await fillAboutAndGoal(user)

    await user.click(
      screen.getAllByRole('radio', { name: /very much like me/i })[0],
    )
    await user.click(screen.getByRole('button', { name: 'Skip the rest' }))

    expect(
      screen.getByRole('heading', { name: /what works for you/i }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Keeping things in mind')).not.toBeInTheDocument()
  })

  it('stays on the review with a message when the server can’t build the profile', async () => {
    mockServer(new Response(null, { status: 500 }))
    const user = userEvent.setup()
    renderForm()
    await fillAboutAndGoal(user)
    for (let i = 0; i < survey.categories.length; i++) {
      await user.click(screen.getByRole('button', { name: /skip this part/i }))
    }
    await user.click(screen.getByRole('button', { name: /skip for now/i }))
    await user.click(screen.getByRole('button', { name: /build my tool/i }))

    expect(
      await screen.findByText(/couldn’t build your profile/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /does this sound like you/i }),
    ).toBeInTheDocument()
  })

  it('offers a retry when the questions can’t be loaded', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () => new Response(null, { status: 500 })),
    )
    renderForm()

    expect(
      await screen.findByText(/couldn’t load the form/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /try again/i }),
    ).toBeInTheDocument()
  })
})
