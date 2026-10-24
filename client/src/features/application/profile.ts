import type { Answers, Survey } from '@/lib/survey'

// Everything the application form collects. Sent to the server as the student profile.
export type Profile = {
  name: string
  stage: string
  stageDetail: string
  interests: string
  goalType: string
  goal: string
  topic: string
  text: string
  files: File[]
  answers: Answers
  likes: string[]
  notes: string
}

export const emptyProfile: Profile = {
  name: '',
  stage: '',
  stageDetail: '',
  interests: '',
  goalType: '',
  goal: '',
  topic: '',
  text: '',
  files: [],
  answers: {},
  likes: [],
  notes: '',
}

export const stages = [
  {
    value: 'School',
    detailLabel: 'Which grade are you in?',
    detailPlaceholder: 'Grade 10',
  },
  {
    value: 'Vocational training',
    detailLabel: 'What are you training as?',
    detailPlaceholder: 'Electronics technician',
  },
  {
    value: 'University',
    detailLabel: 'What do you study?',
    detailPlaceholder: 'Biology, 2nd semester',
  },
  {
    value: 'Something else',
    detailLabel: 'Tell us a bit more',
    detailPlaceholder: 'Evening class in Spanish',
  },
]

export const goalTypes = [
  'Pass an exam',
  'Understand a topic',
  'Finish homework',
  'Keep up in class',
]

export const likeSuggestions = [
  'Short videos',
  'Examples first',
  'Text read aloud',
  'Quizzes to check myself',
  'Small steps with breaks',
  'Pictures and diagrams',
  'Talking it through',
  'Less text on the screen',
]

export type StepId = 'about' | 'goal' | 'survey' | 'notes' | 'review'

export const steps: { id: StepId; title: string }[] = [
  { id: 'about', title: 'About you' },
  { id: 'goal', title: 'Your goal' },
  { id: 'survey', title: 'How you learn' },
  { id: 'notes', title: 'Your notes' },
  { id: 'review', title: 'Check your profile' },
]

// One screen per step, except the survey, which gets one screen per category.
export type Screen = { step: StepId; categoryId?: string; minutes: number }

const surveyMinutes = 5

export function buildScreens(survey: Survey): Screen[] {
  return [
    { step: 'about', minutes: 1 },
    { step: 'goal', minutes: 2 },
    ...survey.categories.map((c) => ({
      step: 'survey' as const,
      categoryId: c.id,
      minutes: surveyMinutes / survey.categories.length,
    })),
    { step: 'notes', minutes: 1 },
    { step: 'review', minutes: 1 },
  ]
}

// Only text fields survive a reload; File objects can't be stored.
const storageKey = 'application-form'

export function loadProfile(): Profile {
  try {
    const saved = sessionStorage.getItem(storageKey)
    return saved
      ? { ...emptyProfile, ...JSON.parse(saved), files: [] }
      : emptyProfile
  } catch {
    return emptyProfile
  }
}

export function saveProfile(profile: Profile) {
  try {
    const { files: _files, ...rest } = profile
    sessionStorage.setItem(storageKey, JSON.stringify(rest))
  } catch {
    // Storage can be blocked (private mode); the form still works without it.
  }
}
