import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, Copy } from 'lucide-react'
import { themeTitles, useAssess, type Answer } from '@/api/assess'
import type { StudentProfile } from '@/api/profile'
import { HermesProgress } from '@/components/HermesProgress'
import { saveRun } from '@/features/learn/learnStore'
import { materialText, profileForHermes } from './studentProfile'

// Shown after "Build my tool": Hermes asks a few questions, picks the themes, and Generate opens the pages in a new tab.
function AssessmentScreen({
  name,
  studentProfile,
  onBack,
}: {
  name: string
  studentProfile: StudentProfile
  onBack: () => void
}) {
  const assess = useAssess()
  const [answers, setAnswers] = useState<Answer[]>([])
  const profile = profileForHermes(studentProfile)
  const started = useRef(false)

  useEffect(() => {
    // The ref stops StrictMode's second effect run from asking Hermes twice.
    if (started.current) return
    started.current = true
    assess.mutate({ profile, answers: [] })
    // oxlint-disable-next-line react/exhaustive-deps
  }, [])

  const question = assess.data?.done === false ? assess.data : undefined
  const themes = assess.data?.done ? assess.data.themes : undefined

  function answer(option: string) {
    if (!question) return
    const next = [...answers, { question: question.question, answer: option }]
    setAnswers(next)
    assess.mutate({ profile, answers: next })
  }

  // Generates in a new tab, so this page keeps the answers and can open the pages again.
  function generate() {
    if (!themes) return
    const id = saveRun({
      profile,
      answers,
      material: materialText(studentProfile),
      themes,
    })
    window.open(`/learn/${id}`, '_blank')
  }

  return (
    <div className="rounded-[20px] border border-rule bg-sheet p-8 shadow-card md:p-14">
      <span className="kicker">Your profile is ready</span>
      <h2
        tabIndex={-1}
        className="mt-3 max-w-[22ch] text-[2.2rem] outline-none md:text-[2.8rem]"
      >
        Thanks, {name}. <em>A few quick questions.</em>
      </h2>

      {answers.length > 0 && (
        <ol className="mt-8 flex list-decimal flex-col gap-1 pl-6 text-graphite">
          {answers.map((item) => (
            <li key={item.question}>
              {item.question}{' '}
              <strong className="text-ink">{item.answer}</strong>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-8 flex flex-col gap-4">
        {assess.isPending && (
          <HermesProgress status={assess.status} reasoning={assess.reasoning} />
        )}

        {question && !assess.isPending && (
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 text-xl font-medium">
              {question.question}
            </legend>
            <div className="flex flex-wrap gap-2">
              {question.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  className="secondary-button wrap"
                  onClick={() => answer(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {themes && (
          <div className="flex flex-col gap-4">
            <p className="text-xl font-medium">
              These fit you best, best first:
            </p>
            <ol className="flex list-decimal flex-col gap-2 pl-6">
              {themes.map((pick) => (
                <li key={pick.theme}>
                  <strong>{themeTitles[pick.theme]}</strong>
                  {pick.reason && `: ${pick.reason}`}
                </li>
              ))}
            </ol>
            <button
              type="button"
              className="primary large self-start"
              onClick={generate}
            >
              Generate
              <ArrowRight size={18} aria-hidden />
            </button>
          </div>
        )}

        {assess.isError && (
          <div role="alert" className="border-l-[3px] border-clay pl-3">
            <p>{assess.error.message}</p>
            <button
              type="button"
              className="primary mt-4"
              onClick={() => assess.mutate({ profile, answers })}
            >
              Try again
            </button>
          </div>
        )}
      </div>

      <ProfileJson profile={studentProfile} />

      <button className="text-button mt-6 pl-0" onClick={onBack}>
        Back to my profile
      </button>
    </div>
  )
}

// The profile JSON the server built, for the team and the demo.
function ProfileJson({ profile }: { profile: StudentProfile }) {
  const [copied, setCopied] = useState(false)
  const json = JSON.stringify(profile, null, 2)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <details className="mt-10 rounded-2xl border border-rule bg-paper">
      <summary className="cursor-pointer px-5 py-4 font-normal">
        See your profile JSON
      </summary>
      <div className="border-t border-rule p-5">
        <div className="mb-3 flex justify-end">
          <button type="button" className="secondary-button" onClick={copy}>
            {copied ? (
              <Check size={16} aria-hidden />
            ) : (
              <Copy size={16} aria-hidden />
            )}
            {copied ? 'Copied' : 'Copy JSON'}
          </button>
        </div>
        <pre className="max-h-96 overflow-auto rounded-xl bg-sheet p-4 font-mono text-[0.78rem] leading-relaxed">
          {json}
        </pre>
      </div>
    </details>
  )
}

export { AssessmentScreen }
