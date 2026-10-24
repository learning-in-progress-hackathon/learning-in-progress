import { useQuery } from '@tanstack/react-query'
import { request } from '@/api/client'

// The learning survey as GET /api/survey returns it. The server owns the questions and does the scoring;
// the client only shows them and collects answers.
export type Survey = {
  version: string
  response_scale: { min: number; max: number; labels: string[] }
  categories: { id: string; title: string; hint: string }[]
  questions: {
    id: string
    category: string
    text: string
    priority: 'high' | 'low'
  }[]
}

export function getSurvey(): Promise<Survey> {
  return request('/survey')
}

export function useSurveyQuestions() {
  return useQuery({ queryKey: ['survey'], queryFn: getSurvey })
}
