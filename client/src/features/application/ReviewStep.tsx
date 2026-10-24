import type { ReactNode } from 'react'
import { useSurvey } from '@/lib/survey'
import { StepHeading } from './StepHeading'
import type { StepId } from './profile'
import type { StepProps } from './ApplicationForm'

function Section({
  title,
  onEdit,
  children,
}: {
  title: string
  onEdit: () => void
  children: ReactNode
}) {
  return (
    <section className="border-t border-dashed border-rule py-5 first:border-t-0 first:pt-0">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="label font-sans">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-sm text-ink underline decoration-rule decoration-[1.5px] underline-offset-4 hover:decoration-ink"
        >
          Edit
        </button>
      </div>
      <div className="mt-2">{children}</div>
    </section>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-graphite">{children}</p>
}

function ReviewStep({
  profile,
  goTo,
}: StepProps & { goTo: (step: StepId) => void }) {
  const answered = Object.keys(profile.answers).length
  const questions = useSurvey().questions.length
  const material = (profile.text.trim() ? 1 : 0) + profile.files.length
  const stage = [profile.stage, profile.stageDetail].filter(Boolean).join(' · ')

  return (
    <div>
      <StepHeading
        label="Check your profile"
        hint="This is what we’ll use to build your tool. Change anything that isn’t right."
      >
        Does this <em>sound like you?</em>
      </StepHeading>

      <div className="rounded-2xl border border-rule bg-paper p-6">
        <Section title="About you" onEdit={() => goTo('about')}>
          <p className="font-normal">{profile.name}</p>
          {stage && <p className="text-graphite">{stage}</p>}
          {profile.interests && (
            <p className="text-graphite">Into {profile.interests}</p>
          )}
        </Section>

        <Section title="Your goal" onEdit={() => goTo('goal')}>
          {profile.goalType || profile.goal ? (
            <>
              {profile.goalType && (
                <p className="font-normal">{profile.goalType}</p>
              )}
              {profile.goal && <p>{profile.goal}</p>}
            </>
          ) : (
            <Empty>No goal yet</Empty>
          )}
        </Section>

        <Section title="What you’re learning" onEdit={() => goTo('goal')}>
          <p className="font-normal">{profile.topic}</p>
          <p className="text-graphite">
            {material === 0
              ? 'No material added yet'
              : `${material} ${material === 1 ? 'item' : 'items'} added`}
          </p>
        </Section>

        <Section title="How you learn" onEdit={() => goTo('survey')}>
          <p>
            {answered === 0
              ? 'Skipped'
              : `${answered} of ${questions} questions answered`}
          </p>
        </Section>

        <Section title="Your notes" onEdit={() => goTo('notes')}>
          {profile.likes.length > 0 && (
            <ul
              className="mb-2 flex flex-wrap gap-1.5"
              aria-label="You like learning with"
            >
              {profile.likes.map((like) => (
                <li
                  key={like}
                  className="rounded-lg border border-pine bg-pine-soft px-2.5 py-0.5 text-sm text-pine-deep"
                >
                  {like}
                </li>
              ))}
            </ul>
          )}
          {profile.notes ? (
            <p className="whitespace-pre-line">{profile.notes}</p>
          ) : (
            !profile.likes.length && <Empty>No notes yet</Empty>
          )}
        </Section>
      </div>
    </div>
  )
}

export { ReviewStep }
