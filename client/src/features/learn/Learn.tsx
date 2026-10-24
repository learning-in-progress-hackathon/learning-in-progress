import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router'
import { themeTitles, type ThemeName } from '@/api/assess'
import { useGeneratePage } from '@/api/generate'
import { HermesProgress } from '@/components/HermesProgress'
import { LearningPage } from '@/components/LearningPage'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { loadPage, loadRun, savePage, type LearnRun } from './learnStore'

// Opens in its own tab: generates a page for every picked theme at once and lets the student switch between them.
export function Learn() {
  const { id = '' } = useParams()
  const [run] = useState(() => loadRun(id))
  const [selected, setSelected] = useState(run?.themes[0]?.theme)

  if (!run) {
    return (
      <main className="p-6">
        <p role="alert">
          This learning page was not found. Start again from the playground.
        </p>
      </main>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <div
        role="tablist"
        aria-label="Themes"
        className="flex flex-wrap gap-2 border-b p-2"
      >
        {run.themes.map((pick) => (
          <Button
            key={pick.theme}
            role="tab"
            aria-selected={pick.theme === selected}
            variant={pick.theme === selected ? 'default' : 'outline'}
            onClick={() => setSelected(pick.theme)}
          >
            {themeTitles[pick.theme]}
          </Button>
        ))}
      </div>
      {/* All panels stay mounted, so every page generates in parallel and keeps its place when hidden. */}
      {run.themes.map((pick) => (
        <ThemePanel
          key={pick.theme}
          id={id}
          run={run}
          theme={pick.theme}
          hidden={pick.theme !== selected}
        />
      ))}
    </div>
  )
}

type ThemePanelProps = {
  id: string
  run: LearnRun
  theme: ThemeName
  hidden: boolean
}

// One theme's page: shows the saved page, or generates it and shows Hermes's progress meanwhile.
function ThemePanel({ id, run, theme, hidden }: ThemePanelProps) {
  const generate = useGeneratePage()
  const [saved] = useState(() => loadPage(id, theme))
  const started = useRef(false)

  function start() {
    const { profile, answers, material } = run
    generate.mutate(
      { profile, answers, material, theme },
      { onSuccess: (page) => savePage(id, theme, page.html) },
    )
  }

  useEffect(() => {
    // The ref stops StrictMode's second effect run from starting another expensive Hermes run.
    if (saved || started.current) return
    started.current = true
    start()
    // oxlint-disable-next-line react/exhaustive-deps
  }, [])

  const html = saved ?? generate.data?.html
  return (
    <div role="tabpanel" hidden={hidden} className="flex flex-1 flex-col">
      {html ? (
        <LearningPage html={html} />
      ) : (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 p-6">
          {generate.isError ? (
            <>
              <p role="alert" className="text-destructive">
                {generate.error.message}
              </p>
              <Button className="self-start" onClick={start}>
                Try again
              </Button>
            </>
          ) : (
            <>
              <HermesProgress
                status={generate.status}
                reasoning={generate.reasoning}
              />
              <PageSkeleton />
            </>
          )}
        </div>
      )}
    </div>
  )
}

// Rough outline of a learning page, shown while Hermes writes the real one.
function PageSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3 pt-3">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-10 w-28" />
    </div>
  )
}
