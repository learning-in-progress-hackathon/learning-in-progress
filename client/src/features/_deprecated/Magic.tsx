import { Sparkles } from 'lucide-react'
import { solutions } from './data'

type MagicProps = {
  topic: string
  selected: number[]
  onBack: () => void
}

export function Magic({ topic, selected, onBack }: MagicProps) {
  return (
    <section className="screen magic-screen">
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
        <p>{topic || 'Dein Thema'}, in einer Form, die zu dir passt.</p>
        <div className="magic-formats">
          {selected.map((index) => {
            const solution = solutions[index]
            const Icon = solution.icon
            return (
              <span key={index}>
                <Icon size={15} />
                {solution.title}
              </span>
            )
          })}
        </div>
        <button className="magic-button">
          <Sparkles size={18} /> Lösung öffnen
        </button>
        <button className="magic-back" onClick={onBack}>
          Auswahl anpassen
        </button>
      </div>
    </section>
  )
}
