import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { useCreateProfile } from '@/api/profile'
import { useSurveyQuestions } from '@/api/survey'
import {
  questionsIn,
  SurveyContext,
  useSurvey,
  type Survey,
} from '@/lib/survey'
import { cn } from '@/lib/utils'
import { AboutStep } from './AboutStep'
import { AssessmentScreen } from './AssessmentScreen'
import { toProfileRequest } from './studentProfile'
import { GoalStep } from './GoalStep'
import { MagicStep } from './MagicStep'
import { NotesStep } from './NotesStep'
import { ProfilePanel } from './ProfilePanel'
import { ReviewStep } from './ReviewStep'
import { SurveyStep } from './SurveyStep'
import {
  buildScreens,
  loadProfile,
  saveProfile,
  steps,
  type Profile,
  type Screen,
  type StepId,
} from './profile'

type Ending = 'assess' | 'magic'

export type StepProps = {
  profile: Profile
  update: (patch: Partial<Profile>) => void
  errors: Partial<Record<keyof Profile, string>>
}

// Returns what's missing before the student can leave this screen.
function validate(
  screen: Screen,
  profile: Profile,
  survey: Survey,
): StepProps['errors'] {
  if (screen.step === 'about') {
    return {
      ...(!profile.name.trim() && { name: 'Tell us what to call you.' }),
      ...(!profile.stage && { stage: 'Pick the one that fits best.' }),
    }
  }
  if (screen.step === 'goal' && !profile.topic.trim()) {
    return { topic: 'Tell us the topic, even in a few words.' }
  }
  if (screen.step === 'survey') {
    const missing = questionsIn(survey, screen.categoryId).some(
      (question) => profile.answers[question.id] === undefined,
    )
    if (missing) {
      return { answers: 'Answer each one, or skip this part for now.' }
    }
  }
  return {}
}

const primaryLabel: Record<StepId, string> = {
  about: 'Continue',
  goal: 'Continue',
  survey: 'Continue',
  notes: 'Continue',
  review: 'Build my tool',
}

// The intake flow: about you, your goal, the learning survey, your notes, and a final check.
function Form() {
  const survey = useSurvey()
  const screens = buildScreens(survey)
  const [index, setIndex] = useState(0)
  const [profile, setProfile] = useState<Profile>(loadProfile)
  const [errors, setErrors] = useState<StepProps['errors']>({})
  const [finished, setFinished] = useState(false)
  // Which flow runs after the profile is built: our assessment, or the Magic page.
  const [ending, setEnding] = useState<Ending>('assess')
  const createProfile = useCreateProfile()
  const panel = useRef<HTMLDivElement>(null)

  const screen = screens[index]
  const step = steps.find((s) => s.id === screen.step)!
  const counted = steps
  const stepNumber = counted.findIndex((s) => s.id === screen.step) + 1
  const minutesLeft = Math.ceil(
    screens.slice(index).reduce((sum, s) => sum + s.minutes, 0),
  )
  const category = survey.categories.find((c) => c.id === screen.categoryId)
  const part =
    survey.categories.findIndex((c) => c.id === screen.categoryId) + 1

  useEffect(() => saveProfile(profile), [profile])

  // Move focus to the new question so keyboard and screen reader users start at the top.
  const shownScreen = useRef(`${index}-${finished}`)
  useEffect(() => {
    if (shownScreen.current === `${index}-${finished}`) return
    shownScreen.current = `${index}-${finished}`
    panel.current?.querySelector('h2')?.focus({ preventScroll: true })
    panel.current?.scrollIntoView?.({ block: 'start' })
  }, [index, finished])

  const update = (patch: Partial<Profile>) => {
    setProfile((current) => ({ ...current, ...patch }))
    // Editing a field clears its error.
    setErrors((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([key]) => !(key in patch)),
      ),
    )
  }

  // "Build my tool" and "Magic page": the server scores the survey and returns the student's profile JSON.
  const buildProfile = (target: Ending) => {
    if (createProfile.isPending) return
    setEnding(target)
    createProfile.mutate(toProfileRequest(profile), {
      onSuccess: () => setFinished(true),
    })
  }

  const moveTo = (target: number) => {
    setErrors({})
    createProfile.reset()
    setIndex(target)
  }

  const goTo = (id: StepId) => moveTo(screens.findIndex((s) => s.step === id))

  const next = () => {
    const found = validate(screen, profile, survey)
    setErrors(found)
    if (Object.keys(found).length) return
    if (screen.step !== 'review') moveTo(index + 1)
    else buildProfile('assess')
  }

  const stepProps = { profile, update, errors }
  const showPanel = ['about', 'goal', 'notes'].includes(screen.step)
  const canSkip = screen.step === 'survey' || screen.step === 'notes'

  if (finished && createProfile.data && ending === 'magic') {
    return <MagicStep topic={profile.topic} profileJson={createProfile.data} />
  }

  if (finished && createProfile.data) {
    return (
      <div ref={panel}>
        <AssessmentScreen
          name={profile.name}
          studentProfile={createProfile.data}
          onBack={() => setFinished(false)}
        />
      </div>
    )
  }

  return (
    <div
      ref={panel}
      className="overflow-hidden rounded-[20px] border border-rule bg-sheet shadow-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-rule px-6 py-4 text-sm md:px-8">
        <span>
          <span className="font-medium">
            Step {stepNumber} of {counted.length}
          </span>{' '}
          · {step.title}
          <span className="text-graphite">
            {' '}
            ·{' '}
            {minutesLeft > 0
              ? `about ${minutesLeft} ${minutesLeft === 1 ? 'minute' : 'minutes'} left`
              : 'almost done'}
          </span>
        </span>
        <div className="flex gap-1.5" aria-hidden>
          {counted.map((s, i) => (
            <i
              key={s.id}
              className={cn(
                'h-1.5 w-9 rounded-full',
                i + 1 < stepNumber
                  ? 'bg-pine'
                  : i + 1 === stepNumber
                    ? 'bg-marigold'
                    : 'bg-rule',
              )}
            />
          ))}
        </div>
        <span className="text-graphite">Saved</span>
      </div>

      <div className={cn('grid', showPanel && 'md:grid-cols-[1.45fr_1fr]')}>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            next()
          }}
          className={cn(
            'p-6 md:p-10 [&_h2]:outline-none',
            showPanel &&
              'border-b border-dashed border-rule md:border-r md:border-b-0',
            screen.step === 'survey' && 'mx-auto w-full max-w-3xl',
          )}
        >
          {screen.step === 'about' && <AboutStep {...stepProps} />}
          {screen.step === 'goal' && <GoalStep {...stepProps} />}
          {screen.step === 'survey' && category && (
            <SurveyStep {...stepProps} category={category} part={part} />
          )}
          {screen.step === 'notes' && <NotesStep {...stepProps} />}
          {screen.step === 'review' && (
            <ReviewStep {...stepProps} goTo={goTo} />
          )}

          {createProfile.isError && (
            <p
              role="alert"
              className="mt-8 border-l-[3px] border-clay pl-3 text-sm"
            >
              We couldn’t build your profile. Check your connection and try
              again.
            </p>
          )}

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
            {index > 0 ? (
              <button
                type="button"
                className="text-button inline-flex items-center gap-2 pl-0"
                onClick={() => moveTo(index - 1)}
              >
                <ArrowLeft size={18} aria-hidden />
                Back
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-3">
              {screen.step === 'survey' && part < survey.categories.length && (
                // Skipped parts send no answers; the server leaves their categories out of the profile.
                <button
                  type="button"
                  className="text-button"
                  onClick={() => goTo('notes')}
                >
                  Skip the rest
                </button>
              )}
              {canSkip && (
                <button
                  type="button"
                  className="text-button"
                  onClick={() => moveTo(index + 1)}
                >
                  {screen.step === 'survey' ? 'Skip this part' : 'Skip for now'}
                </button>
              )}
              {screen.step === 'review' && (
                <button
                  type="button"
                  className="primary large"
                  onClick={() => buildProfile('magic')}
                >
                  {createProfile.isPending && ending === 'magic'
                    ? 'Building…'
                    : 'Magic page'}
                  <Sparkles size={18} aria-hidden />
                </button>
              )}
              <button type="submit" className="primary large">
                {createProfile.isPending && ending === 'assess'
                  ? 'Building…'
                  : primaryLabel[screen.step]}
                <ArrowRight size={18} aria-hidden />
              </button>
            </div>
          </div>
        </form>

        {showPanel && <ProfilePanel profile={profile} />}
      </div>
    </div>
  )
}

// Loads the survey questions from the server before showing the form.
function ApplicationForm() {
  const survey = useSurveyQuestions()

  if (survey.data) {
    return (
      <SurveyContext value={survey.data}>
        <Form />
      </SurveyContext>
    )
  }

  return (
    <div className="rounded-[20px] border border-rule bg-sheet p-8 shadow-card md:p-14">
      {survey.isError ? (
        <div role="alert">
          <p>We couldn’t load the form. Check your connection and try again.</p>
          <button className="primary mt-6" onClick={() => survey.refetch()}>
            Try again
          </button>
        </div>
      ) : (
        <p className="text-graphite">Getting things ready…</p>
      )}
    </div>
  )
}

export { ApplicationForm }
