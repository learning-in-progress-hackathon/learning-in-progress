import type { StudentProfile } from '@/api/profile'

// What POST /api/solution returns: the URL of the just-created Solution Page.
export type SolutionReply = { url: string }

// Asks the backend to have Hermes build this student's Solution Page; resolves with the page URL.
export async function generateSolution(
  profileJson: StudentProfile,
): Promise<SolutionReply> {
  const response = await fetch('/api/solution', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile: profileJson }),
  })
  if (!response.ok)
    throw new Error(`Solution request failed: ${response.status}`)
  return response.json()
}
