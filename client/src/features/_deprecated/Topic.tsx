import { useRef, useState } from 'react'
import { ArrowRight, Check, Upload } from 'lucide-react'

type TopicProps = {
  profile: { style: string; need: string }
  onBack: () => void
  onNext: (topic: string) => void
}

export function Topic({ profile, onBack, onNext }: TopicProps) {
  const [topic, setTopic] = useState('')
  const [file, setFile] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <section className="screen split-screen">
      <div className="profile-panel">
        <span className="kicker">
          <Check size={16} /> Dein Lernprofil steht
        </span>
        <h2>
          Wir haben ein Gefühl dafür, <em>wie du lernst.</em>
        </h2>
        <p>
          Du lernst am besten {profile.style}, in {profile.need}. Darauf bauen
          wir jetzt auf.
        </p>
        <div className="profile-tags">
          <span>Kurze Einheiten</span>
          <span>Klare Orientierung</span>
          <span>Aktives Feedback</span>
        </div>
      </div>
      <div className="topic-panel">
        <span className="step-overline">Jetzt zu deinem Thema</span>
        <h3>Was möchtest du lernen?</h3>
        <label className="field-label" htmlFor="topic">
          Thema oder Ziel
        </label>
        <textarea
          id="topic"
          className="topic-input"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          placeholder="z. B. Die Grundlagen der Photosynthese verstehen …"
        />
        <div className="or">
          <span>oder ergänze Material</span>
        </div>
        <button className="dropzone" onClick={() => fileRef.current?.click()}>
          {file ? <Check /> : <Upload />}
          <span>
            <b>{file || 'Datei hier ablegen'}</b>
            <small>
              {file
                ? 'Bereit zur Analyse'
                : 'PDF, Video, Audio oder Text · bis 50 MB'}
            </small>
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          hidden
          onChange={(event) => setFile(event.target.files?.[0]?.name || '')}
        />
        <button className="primary full" onClick={() => onNext(topic)}>
          Weiter <ArrowRight size={18} />
        </button>
        <small className="optional">
          Thema und Datei sind optional. Du kannst auch frei starten.
        </small>
        <button className="text-button" onClick={onBack}>
          Zurück
        </button>
      </div>
    </section>
  )
}
