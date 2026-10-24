import type { ReactNode } from 'react'
import { useSurvey } from '@/lib/survey'
import type { Profile } from './profile'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-5">
      <span className="label mb-1 block">{label}</span>
      <div className="text-[0.92rem]">{children}</div>
    </div>
  )
}

function Pending({ children }: { children: ReactNode }) {
  return (
    <span className="border-b border-dashed border-graphite text-sm text-graphite">
      {children}
    </span>
  )
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="mr-1.5 mb-1.5 inline-block rounded-lg border border-pine bg-pine-soft px-2.5 py-0.5 text-[0.8rem] text-pine-deep">
      {children}
    </span>
  )
}

// Live summary next to each step, on ruled notebook paper. Shows the student what we know so far.
function ProfilePanel({ profile }: { profile: Profile }) {
  const material = (profile.text.trim() ? 1 : 0) + profile.files.length
  const stage = [profile.stage, profile.stageDetail].filter(Boolean).join(' · ')
  const answered = Object.keys(profile.answers).length
  const totalQuestions = useSurvey().questions.length

  return (
    <aside
      aria-label="Your learning profile"
      className="bg-[repeating-linear-gradient(var(--sheet)_0_31px,var(--pine-soft)_31px_32px)] p-8 md:p-10"
    >
      <div className="md:sticky md:top-8">
        <span className="label">Your learning profile</span>
        <p className="mt-2 mb-6 text-[1.3rem] font-semibold">
          What we know so far
        </p>

        <Row label="You">
          {profile.name || stage ? (
            <p>{[profile.name, stage].filter(Boolean).join(' · ')}</p>
          ) : (
            <Pending>Step 1</Pending>
          )}
        </Row>
        <Row label="Goal">
          {profile.goalType || profile.goal ? (
            <p>{profile.goalType || profile.goal}</p>
          ) : (
            <Pending>Step 2</Pending>
          )}
        </Row>
        <Row label="Learning">
          {profile.topic ? (
            <>
              <p>{profile.topic}</p>
              {material > 0 && (
                <p className="text-graphite">
                  {material} {material === 1 ? 'item' : 'items'} of material
                </p>
              )}
            </>
          ) : (
            <Pending>Step 2</Pending>
          )}
        </Row>
        <Row label="How you learn">
          {answered > 0 ? (
            <p>
              {answered} of {totalQuestions} questions answered
            </p>
          ) : (
            <Pending>Step 3</Pending>
          )}
        </Row>
        <Row label="Works for you">
          {profile.likes.length > 0 || profile.notes ? (
            <>
              {profile.likes.map((like) => (
                <Tag key={like}>{like}</Tag>
              ))}
              {profile.notes && <p className="line-clamp-2">{profile.notes}</p>}
            </>
          ) : (
            <Pending>Step 4</Pending>
          )}
        </Row>

        <p className="mt-8 border-l-[3px] border-pine pl-3 text-sm text-graphite">
          You can see and change everything here. We only use it to build your
          tool.
        </p>
      </div>
    </aside>
  )
}

export { ProfilePanel }
