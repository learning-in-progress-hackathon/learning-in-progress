import { useState, type FormEvent } from 'react'
import { useBuildPage, type BuildInput } from '@/api/build'
import { LearningPage } from '@/components/LearningPage'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { mockStudent } from './mockStudent'

// Test page for the build step: sends the student data typed in the box to Hermes and shows the page it builds.
export function Playground() {
  const [input, setInput] = useState(JSON.stringify(mockStudent, null, 2))
  const [parseError, setParseError] = useState('')
  const build = useBuildPage()

  if (build.data) {
    return <LearningPage html={build.data.html} onBack={() => build.reset()} />
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    let student: BuildInput
    try {
      student = JSON.parse(input)
    } catch {
      setParseError('The student data is not valid JSON.')
      return
    }
    setParseError('')
    build.mutate(student)
  }

  const error = parseError || build.error?.message

  return (
    <main className="flex min-h-svh flex-col items-center gap-4 p-6">
      <h1 className="text-4xl font-semibold tracking-tight">
        Build playground
      </h1>
      <form onSubmit={submit} className="flex w-full max-w-3xl flex-col gap-3">
        <Textarea
          aria-label="Student data"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={20}
          className="font-mono text-sm"
          disabled={build.isPending}
        />
        <Button type="submit" disabled={build.isPending}>
          Build learning page
        </Button>
        {build.isPending && (
          <p aria-live="polite" className="text-muted-foreground">
            {build.status || 'Starting…'}
          </p>
        )}
        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}
      </form>
    </main>
  )
}
