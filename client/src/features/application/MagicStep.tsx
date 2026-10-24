import { useEffect, useRef, useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import type { StudentProfile } from '@/api/profile'
import { generateSolution } from './solution'

// Rotating status lines shown while Hermes builds the Solution Page.
const buzzwords = [
  'Dein Profil wird gelesen…',
  'Deine Lösung wird gebaut…',
  'Das Material wird angepasst…',
  'Alles wird geprüft…',
]

// The Magic Page: shown after "Build my tool". "Lösung öffnen" has Hermes build the
// Solution Page, then redirects to it.
// Styling comes from the deprecated onboarding flow (onboarding.css). The tailwind
// classes pull the section out of the application card's width container, so the
// screen is full-bleed like it was on the old home page.
export function MagicStep({
  topic,
  profileJson,
}: {
  topic: string
  profileJson: StudentProfile
}) {
  const [status, setStatus] = useState<'idle' | 'generating' | 'error'>('idle')
  const [buzzword, setBuzzword] = useState(buzzwords[0])
  const interval = useRef<number>(undefined)

  const start = () => {
    setStatus('generating')
    interval.current = window.setInterval(() => {
      setBuzzword(
        (current) =>
          buzzwords[(buzzwords.indexOf(current) + 1) % buzzwords.length],
      )
    }, 2500)
    generateSolution(profileJson).then(
      ({ url }) => {
        window.location.href = url
      },
      () => {
        window.clearInterval(interval.current)
        setStatus('error')
      },
    )
  }

  useEffect(() => () => window.clearInterval(interval.current), [])

  return (
    <section className="magic-screen relative left-1/2 w-screen -translate-x-1/2">
      <div className="magic-orbit orbit-a" />
      <div className="magic-orbit orbit-b" />
      <div className="magic-particle particle-a">
        <Sparkles size={18} />
      </div>
      <div className="magic-particle particle-b" />
      <div className="magic-particle particle-c" />
      <div className="magic-content">
        <span className="magic-mark">
          <Sparkles size={34} />
        </span>
        <span className="kicker">Für dich gebaut</span>
        <h1>
          Hier entsteht
          <br />
          <em>deine magische Lösung.</em>
        </h1>
        <p>
          {status === 'generating'
            ? 'Einen Moment — das dauert ein bis zwei Minuten.'
            : `${topic || 'Dein Thema'}, in einer Form, die zu dir passt.`}
        </p>

        {status === 'generating' && (
          <div
            className="mb-8 flex items-center justify-center gap-2"
            aria-hidden
          >
            <span className="flex gap-2">
              {buzzwords.map((b) => (
                <i
                  key={b}
                  className={`h-1.5 w-8 rounded-full transition-colors ${
                    b === buzzword ? 'bg-[#6955c6]' : 'bg-[#6955c6]/25'
                  }`}
                />
              ))}
            </span>
          </div>
        )}

        <button
          className="magic-button disabled:cursor-wait disabled:opacity-70"
          disabled={status === 'generating'}
          onClick={start}
          aria-live="polite"
        >
          {status === 'generating' ? (
            <>
              <Loader2 className="animate-spin" size={18} aria-hidden />
              {buzzword}
            </>
          ) : (
            <>
              <Sparkles size={18} /> Lösung öffnen
            </>
          )}
        </button>
        {status === 'error' && (
          <p role="alert" className="magic-back text-[13px]">
            Das hat nicht geklappt. Prüf deine Verbindung und versuch es
            nochmal.
          </p>
        )}
      </div>
    </section>
  )
}
