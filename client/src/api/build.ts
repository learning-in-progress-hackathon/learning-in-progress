import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import type { Answer, Profile } from '@/api/assess'
import { ApiError, streamRequest } from '@/api/client'

export type BuildInput = {
  profile: Profile
  answers: Answer[]
  material: string
}

export type BuiltPage = { html: string }

type BuildEvent =
  | { event: 'status'; text: string }
  | { event: 'done'; html: string }
  | { event: 'error'; message: string }

// Streams the build: calls onStatus with Hermes's progress, then resolves with the finished page.
export async function buildPage(
  input: BuildInput,
  onStatus: (text: string) => void,
): Promise<BuiltPage> {
  let page: BuiltPage | undefined
  await streamRequest('/build', {
    body: input,
    onEvent: (event, data) => {
      const message = { event, ...(data as object) } as BuildEvent
      if (message.event === 'status') onStatus(message.text)
      if (message.event === 'done') page = { html: message.html }
      if (message.event === 'error') throw new ApiError(message.message)
    },
  })
  if (!page) throw new ApiError('The build stopped before the page was ready.')
  return page
}

export function useBuildPage() {
  const [status, setStatus] = useState('')
  const mutation = useMutation({
    mutationFn: (input: BuildInput) => {
      setStatus('')
      return buildPage(input, setStatus)
    },
  })
  return { ...mutation, status }
}
