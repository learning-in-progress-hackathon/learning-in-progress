import { ArrowRight, Sparkles, Volume2, BookOpen, Map } from 'lucide-react'

type HomeProps = {
  onStart: () => void
}

export function Home({ onStart }: HomeProps) {
  return (
    <section className="screen home">
      <div className="home-copy">
        <span className="kicker">
          <Sparkles size={16} /> Lernen, das zu dir passt
        </span>
        <h1>
          Dein Wissen.
          <br />
          <em>Deine Form.</em>
        </h1>
        <p>
          Wir verwandeln, was du lernen möchtest, in ein Werkzeug, das so denkt
          wie du. Fundiert, persönlich und direkt einsatzbereit.
        </p>
        <button className="primary large" onClick={onStart}>
          Los geht's <ArrowRight />
        </button>
        <small>
          Dauert etwa 8 Minuten · Keine Vorkenntnisse nötig · Du siehst alles,
          was wir über dich wissen
        </small>
      </div>
      <div className="hero-art" aria-hidden="true">
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <div className="art-card card-a">
          <BookOpen />
          <span>Zu viel Text</span>
        </div>
        <div className="art-card card-b">
          <Volume2 />
          <span>Hör es dir an</span>
        </div>
        <div className="art-card card-c">
          <Map />
          <span>Sieh Zusammenhänge</span>
        </div>
        <div className="art-center">
          <Sparkles size={34} />
          <b>Passt sich dir an</b>
        </div>
      </div>
    </section>
  )
}
