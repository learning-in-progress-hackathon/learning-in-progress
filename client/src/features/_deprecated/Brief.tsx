import { BookOpen, Sparkles } from 'lucide-react'

type BriefProps = {
  topic: string
  onNext: () => void
}

export function Brief({ topic, onNext }: BriefProps) {
  return (
    <section className="screen understood-screen">
      <div className="understood-wrap">
        <span className="kicker">
          <Sparkles size={16} /> Das habe ich verstanden
        </span>
        <h2>
          Dein persönlicher <em>Lernauftrag</em>
        </h2>
        <div className="brief-card">
          <div className="brief-row">
            <span className="number">01</span>
            <div>
              <small>Dein Ziel</small>
              <p>
                {topic ||
                  'Ein neues Thema sicher verstehen und anwenden können.'}
              </p>
            </div>
          </div>
          <div className="brief-row">
            <span className="number">02</span>
            <div>
              <small>Was du brauchst</small>
              <p>
                Klare Orientierung, kurze Einheiten und aktives Feedback ohne
                unnötige Ablenkung.
              </p>
            </div>
          </div>
          <div className="brief-row">
            <span className="number">03</span>
            <div>
              <small>Wie wir es aufbereiten</small>
              <p>
                Visuell, interaktiv und in deinem Tempo – mit schnellen
                Erfolgsmomenten.
              </p>
            </div>
          </div>
        </div>
        <div className="callout">
          <BookOpen />
          <p>
            <b>Der Inhalt bleibt derselbe.</b>
            <br />
            Wir verändern nur die Form, in der er bei dir ankommt.
          </p>
        </div>
        <button className="primary large" onClick={onNext}>
          Schlag mir Lösungen vor <Sparkles />
        </button>
      </div>
    </section>
  )
}
