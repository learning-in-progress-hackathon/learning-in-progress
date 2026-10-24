import { useMutation } from '@tanstack/react-query'
import { request } from '@/api/client'

export type ProfileRequest = {
  student: {
    name: string
    stage: string
    stage_detail: string
    interests: string
  }
  goal: { type: string; in_their_words: string }
  material: {
    topic: string
    text: string
    // File names only; uploads aren't supported yet.
    files: string[]
  }
  // Survey answers by item id, from 1 to 5. Skipped items are left out.
  answers: Record<string, number>
  preferences: { likes_learning_with: string[]; notes: string }
}

// The student's profile: what they told us, plus the learning instructions their survey answers chose, by category.
export type StudentProfile = Omit<ProfileRequest, 'answers'> & {
  scale_version: string
  learning_instructions: Record<string, string[]>
}

export function createProfile(body: ProfileRequest): Promise<StudentProfile> {
  return request('/profile', { method: 'POST', body })
}

export function useCreateProfile() {
  return useMutation({ mutationFn: createProfile })
}
