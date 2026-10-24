import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  BookOpen,
  Check,
  CircleHelp,
  Layers,
  ListChecks,
  Map,
  MessageCircle,
  Mic,
  Sparkles,
  Target,
  Upload,
  Video,
  Volume2,
} from 'lucide-react'

export const steps = {
  home: 0,
  dialog: 1,
  topic: 2,
  brief: 3,
  solutions: 4,
  magic: 5,
} as const

export type Step = (typeof steps)[keyof typeof steps]

export type Question = {
  eyebrow: string
  title: string
  hint: string
  chips: string[]
}

export const questions: Question[] = [
  {
    eyebrow: 'Lernen & Aufmerksamkeit',
    title: 'Wann fühlt sich Lernen für dich leicht an?',
    hint: 'Zum Beispiel: Wenn ich etwas sehe, ausprobiere oder mit jemandem bespreche.',
    chips: ['Wenn ich es sehe', 'Wenn ich es höre', 'Wenn ich es ausprobiere'],
  },
  {
    eyebrow: 'Herausforderungen',
    title: 'Was macht Lernen gerade unnötig schwer?',
    hint: 'Du kannst ganz offen antworten — es gibt hier kein richtig oder falsch.',
    chips: ['Zu viel Text', 'Fokus halten', 'Überblick behalten'],
  },
  {
    eyebrow: 'Rhythmus',
    title: 'Wie arbeitest du am liebsten?',
    hint: 'Denk an Tempo, Pausen und wie viel Information auf einmal gut funktioniert.',
    chips: ['In kurzen Sprints', 'Mit klaren Schritten', 'Flexibel & spontan'],
  },
  {
    eyebrow: 'Motivation',
    title: 'Was hilft dir, dranzubleiben?',
    hint: 'Was gibt dir das Gefühl: Ja, ich komme wirklich voran?',
    chips: ['Schnelle Erfolge', 'Direktes Feedback', 'Ein klares Ziel'],
  },
  {
    eyebrow: 'Was funktioniert',
    title: 'Was hat dir bisher schon geholfen?',
    hint: 'Auch kleine Dinge zählen. Wir bauen auf dem auf, was du über dich weißt.',
    chips: ['Farben & Bilder', 'Zusammenfassen', 'Fragen stellen'],
  },
]

export type Solution = {
  icon: LucideIcon
  title: string
  desc: string
  tag: string
  color: string
}

export const solutions: Solution[] = [
  {
    icon: ListChecks,
    title: 'Fokus-Pfad',
    desc: 'Der Stoff als klare, kurze Etappen mit nur einer Aufgabe zur Zeit.',
    tag: 'Empfohlen',
    color: 'plum',
  },
  {
    icon: MessageCircle,
    title: 'Lern-Dialog',
    desc: 'Erarbeite das Thema im Gespräch – mit Rückfragen statt langen Texten.',
    tag: 'Interaktiv',
    color: 'blue',
  },
  {
    icon: Layers,
    title: 'Smart Cards',
    desc: 'Visuelle Karten, die sich automatisch an deinen Lernstand anpassen.',
    tag: 'Schnell',
    color: 'mint',
  },
  {
    icon: Map,
    title: 'Wissenskarte',
    desc: 'Sieh auf einen Blick, wie Begriffe und Zusammenhänge verbunden sind.',
    tag: 'Visuell',
    color: 'peach',
  },
  {
    icon: Volume2,
    title: 'Audio Guide',
    desc: 'Ein ruhiger Audiopfad mit Pausen und kurzen Reflexionsfragen.',
    tag: 'Hands-free',
    color: 'lavender',
  },
  {
    icon: CircleHelp,
    title: 'Entdecker-Quiz',
    desc: 'Lerne über kleine Entscheidungen, Erklärungen und sofortiges Feedback.',
    tag: 'Spielerisch',
    color: 'yellow',
  },
  {
    icon: Target,
    title: 'Deep Focus',
    desc: 'Eine ablenkungsarme Ansicht, die Inhalte auf das Wesentliche reduziert.',
    tag: 'Ruhig',
    color: 'blue',
  },
  {
    icon: Video,
    title: 'Video Companion',
    desc: 'Dein Material als Kapitel, Transkript und begleitender Video-Chat.',
    tag: 'Multimodal',
    color: 'peach',
  },
  {
    icon: BookOpen,
    title: 'Easy Reader',
    desc: 'Texte in lesefreundlicher Sprache, Typografie und Länge aufbereitet.',
    tag: 'Barrierearm',
    color: 'mint',
  },
]

export const icons = {
  arrow: ArrowRight,
  spark: Sparkles,
  mic: Mic,
  upload: Upload,
  check: Check,
}
