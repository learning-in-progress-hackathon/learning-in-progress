import { Check, Sparkles } from 'lucide-react'
import { solutions } from './data'

type SolutionsProps = {
  selected: number[]
  onToggle: (index: number) => void
  onBack: () => void
  onNext: () => void
}

export function Solutions({
  selected,
  onToggle,
  onBack,
  onNext,
}: SolutionsProps) {
  return (
    <section className="screen solution-screen">
      <div className="section-heading">
        <span className="kicker">
          <Sparkles size={16} /> Für dich entwickelt
        </span>
        <h2>
          Was fühlt sich <em>richtig</em> an?
        </h2>
        <p>Wähle eine oder mehrere Formen.</p>
      </div>
      <div className="solution-grid">
        {solutions.slice(0, 6).map((item, index) => (
          <button
            key={item.title}
            className={
              selected.includes(index)
                ? 'solution-card active'
                : 'solution-card'
            }
            onClick={() => onToggle(index)}
            aria-pressed={selected.includes(index)}
          >
            <span className="solution-tag">{item.tag}</span>
            <span className={`solution-visual visual-${index} ${item.color}`}>
              <span className="visual-main">
                <item.icon size={30} />
              </span>
              <i />
              <i />
              <i />
            </span>
            <span className="solution-title">
              <b>{item.title}</b>
              <span className="select-mark">
                {selected.includes(index) ? <Check size={16} /> : '+'}
              </span>
            </span>
          </button>
        ))}
      </div>
      <div className="sticky-action">
        <span>
          <b>{selected.length || 'Keine'}</b>{' '}
          {selected.length === 1 ? 'Lösung' : 'Lösungen'} ausgewählt
        </span>
        <div className="dialog-actions">
          <button className="text-button" onClick={onBack}>
            Zurück
          </button>
          <button
            className="primary"
            disabled={!selected.length}
            onClick={onNext}
          >
            Lösung bauen <Sparkles size={18} />
          </button>
        </div>
      </div>
    </section>
  )
}
