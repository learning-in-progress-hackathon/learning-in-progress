import type { BuildInput } from '@/api/build'

// Made-up demo student, standing in for the intake and assessment steps until they exist.
export const mockStudent: BuildInput = {
  profile: {
    name: 'Peter',
    challenges: ['ADHD'],
    goals: 'Understand osmosis for the next biology test',
    interests: ['Minecraft', 'Football'],
    whatWorks: 'Instant feedback, small steps, being shown instead of told',
  },
  answers: [
    {
      question: 'Do you prefer reading, listening, or doing?',
      answer: 'Doing, clicking through things myself',
    },
    {
      question: 'How long can you usually focus on one thing?',
      answer: 'About 10 minutes',
    },
    {
      question: 'What helps you after you get something wrong?',
      answer: 'Seeing straight away what the right answer is and why',
    },
  ],
  material: `Biologie, Klasse 10: Diffusion und Osmose

Diffusion: Teilchen in Flüssigkeiten und Gasen bewegen sich ständig zufällig (Brownsche Bewegung). Dadurch verteilen sie sich von selbst von Orten hoher Konzentration zu Orten niedriger Konzentration, bis die Konzentration überall gleich ist. Diffusion braucht keine Energie von der Zelle.

Biomembran: Die Zellmembran ist selektiv permeabel. Kleine Teilchen wie Wasser, Sauerstoff und Kohlenstoffdioxid gelangen hindurch, große oder geladene Teilchen wie Zucker oder Ionen nur über bestimmte Transportproteine.

Osmose: Osmose ist die Diffusion von Wasser durch eine selektiv permeable Membran. Wasser strömt zur Seite mit der höheren Konzentration gelöster Teilchen.

- Hypotonisch (weniger gelöste Teilchen außen): Wasser strömt in die Zelle. Rote Blutzellen schwellen an und können platzen. Pflanzenzellen werden prall (Turgor).
- Isotonisch (gleich viele gelöste Teilchen): Die Zelle bleibt unverändert.
- Hypertonisch (mehr gelöste Teilchen außen): Wasser strömt aus der Zelle. Rote Blutzellen schrumpfen. Bei Pflanzenzellen löst sich der Zellinhalt von der Zellwand (Plasmolyse).

Beispiel: Salz auf Gurkenscheiben macht die Lösung außen hypertonisch, Wasser tritt aus, die Gurke wird weich.

Bedeutung: Zellen müssen ihren osmotischen Wert konstant halten (Homöostase). Deshalb bekommen Patienten eine isotonische Kochsalzlösung (0,9 %) als Infusion.`,
}
