import { Suspense, lazy, type ComponentType } from 'react'
import { Link, useParams } from 'react-router'

// One wildcard route serves every Hermes-generated Solution Page: the module
// keys are the file paths, so the uuid picks the component (see ADR 0001).
const pages = import.meta.glob('./generated/*.tsx')

// Lazily loaded generated pages, built once at module level so React sees a
// stable component per path. Vite re-evaluates this module when Hermes adds a
// file, and the flow does a full-page redirect, so new pages are picked up.
const resolved = new Map<string, ComponentType>(
  Object.entries(pages).map(([path, load]) => [
    path,
    lazy(async () => {
      const module = await load()
      const component = (module as { default?: unknown }).default
      if (typeof component !== 'function') {
        throw new Error(`Generated page ${path} has no default export`)
      }
      return { default: component as ComponentType }
    }),
  ]),
)

function NotFound() {
  return (
    <main className="app-shell application-page">
      <div className="mx-auto max-w-[1120px] px-4 py-10 md:px-6 md:py-14">
        <div className="rounded-[20px] border border-rule bg-sheet p-8 shadow-card md:p-14">
          <span className="kicker">Nothing here</span>
          <h2 tabIndex={-1} className="mt-3 text-[2rem] outline-none">
            Diese Seite gibt es nicht (mehr).
          </h2>
          <p className="mt-4 max-w-[46ch] text-graphite">
            Generated pages live only on the server that built them.
          </p>
          <Link className="primary mt-8 inline-flex" to="/">
            Zur Startseite
          </Link>
        </div>
      </div>
    </main>
  )
}

function Loading() {
  return (
    <main className="app-shell application-page">
      <div className="mx-auto max-w-[1120px] px-4 py-10 md:px-6 md:py-14">
        <p className="text-graphite">Loading your solution…</p>
      </div>
    </main>
  )
}

// The page arrives as a prop, so its identity is stable across renders.
// The application-page wrapper provides the design tokens the generated page
// is promised (bg-paper, border-rule, text-graphite, …).
function SolutionOutlet({ Page }: { Page: ComponentType }) {
  return (
    <Suspense fallback={<Loading />}>
      <div className="application-page">
        <Page />
      </div>
    </Suspense>
  )
}

export function SolutionRoute() {
  const { uuid } = useParams()
  const Page = uuid ? resolved.get(`./generated/${uuid}.tsx`) : undefined

  if (!Page) return <NotFound />

  return <SolutionOutlet Page={Page} />
}
