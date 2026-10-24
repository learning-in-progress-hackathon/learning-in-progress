import { useRef, useState } from 'react'
import { ArrowRight, Mic } from 'lucide-react'
import type { Question } from './data'

type DialogProps = {
  question: Question
  questionIndex: number
  questionCount: number
  onBack: () => void
  onNext: (answer: string) => void
}

type SpeechRecognitionLike = {
  lang: string
  start: () => void
  onstart: (() => void) | null
  onend: (() => void) | null
  onresult: ((event: { results: string[][][] }) => void) | null
}

export function Dialog({
  question,
  questionIndex,
  questionCount,
  onBack,
  onNext,
}: DialogProps) {
  const [answer, setAnswer] = useState('')
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  function startVoice() {
    const windowWithSpeech = window as Window &
      typeof globalThis & {
        SpeechRecognition?: new () => SpeechRecognitionLike
        webkitSpeechRecognition?: new () => SpeechRecognitionLike
      }
    const SpeechRecognition =
      windowWithSpeech.SpeechRecognition ||
      windowWithSpeech.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setListening((current) => !current)
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'de-DE'
    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onresult = (event) => setAnswer(event.results[0][0][0])
    recognitionRef.current = recognition
    recognition.start()
  }

  function next() {
    const value = answer.trim() || question.chips[0]
    setAnswer('')
    onNext(value)
  }

  return (
    <section className="screen dialog-screen">
      <div className="question-count">
        Frage {questionIndex + 1} / {questionCount}
      </div>
      <div className="dialog-card">
        <span className="kicker">{question.eyebrow}</span>
        <h2>{question.title}</h2>
        <p>{question.hint}</p>
        <div className="chips">
          {question.chips.map((chip) => (
            <button
              key={chip}
              className={answer === chip ? 'chip selected' : 'chip'}
              onClick={() => setAnswer(chip)}
            >
              {chip}
            </button>
          ))}
        </div>
        <div className="answer-box">
          <textarea
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="Erzähl uns, was dir in den Sinn kommt …"
          />
          <button
            className={listening ? 'mic listening' : 'mic'}
            onClick={startVoice}
            aria-label="Mit Sprache antworten"
          >
            <Mic />
          </button>
        </div>
        <div className="dialog-actions">
          <button className="text-button" onClick={onBack}>
            Zurück
          </button>
          <button className="primary" onClick={next}>
            Weiter <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </section>
  )
}
