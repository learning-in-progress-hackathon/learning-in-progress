import { Button } from '@/components/ui/button'

type LearningPageProps = { html: string; onBack: () => void }

export function LearningPage({ html, onBack }: LearningPageProps) {
  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <div className="border-b p-2">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
      </div>
      <iframe
        title="Your learning page"
        sandbox="allow-scripts"
        srcDoc={html}
        className="w-full flex-1"
      />
    </div>
  )
}
