import type { ProfileRequest, StudentProfile } from '@/api/profile'
import type { Profile } from './profile'

// The form data in the shape the server expects. Survey answers go raw; the server does the scoring.
export function toProfileRequest(profile: Profile): ProfileRequest {
  return {
    student: {
      name: profile.name,
      stage: profile.stage,
      stage_detail: profile.stageDetail,
      interests: profile.interests,
    },
    goal: {
      type: profile.goalType,
      in_their_words: profile.goal,
    },
    material: {
      topic: profile.topic,
      text: profile.text.trim(),
      files: profile.files.map((f) => f.name),
    },
    answers: profile.answers,
    preferences: {
      likes_learning_with: profile.likes,
      notes: profile.notes,
    },
  }
}

// The profile Hermes gets for the assessment and the page. The pasted text is left out, because it can be
// long and the page gets it separately as the material.
export function profileForHermes(profile: StudentProfile) {
  const { text: _text, ...material } = profile.material
  return { ...profile, material }
}

// The material the page teaches: the topic, then the pasted text.
export function materialText(profile: StudentProfile): string {
  return [profile.material.topic, profile.material.text]
    .filter(Boolean)
    .join('\n\n')
}
