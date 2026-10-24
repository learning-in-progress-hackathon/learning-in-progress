import { createContext, use } from 'react'
import type { Survey } from '@/api/survey'

export type { Survey }

export type SurveyCategory = Survey['categories'][number]
export type Answers = Record<string, number>

export function questionsIn(survey: Survey, categoryId: string | undefined) {
  return survey.questions.filter((q) => q.category === categoryId)
}

export const SurveyContext = createContext<Survey | null>(null)

export function useSurvey(): Survey {
  const survey = use(SurveyContext)
  if (!survey) throw new Error('useSurvey needs a loaded survey above it')
  return survey
}
