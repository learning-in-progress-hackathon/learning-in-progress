type TopbarProps = {
  step: number
  onHome: () => void
}

export function Topbar({ step, onHome }: TopbarProps) {
  const progress = Math.max(0, Math.min(100, (step / 5) * 100))

  return (
    <header className="topbar">
      <button className="brand" onClick={onHome} aria-label="Zur Startseite">
        <span className="brand-mark">
          <span />
          <span />
          <span />
        </span>
        <span>learning in progress</span>
      </button>
      {step > 0 && (
        <div className="stepper" aria-label={`Schritt ${step + 1} von 6`}>
          <span className="step-label">Schritt {step + 1} von 6</span>
          <span className="progress">
            <i style={{ width: `${progress}%` }} />
          </span>
        </div>
      )}
      <button className="help" aria-label="Hilfe">
        ?
      </button>
    </header>
  )
}
