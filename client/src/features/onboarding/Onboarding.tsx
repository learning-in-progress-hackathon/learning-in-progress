import { useNavigate } from 'react-router'
import { Topbar } from './Topbar'
import { Home } from './Home'

// The home page: top bar and the hero screen. "Los geht's" jumps into the application flow.
export function Onboarding() {
  const navigate = useNavigate()

  return (
    <main className="app-shell">
      <Topbar step={0} onHome={() => navigate('/')} />
      <Home onStart={() => navigate('/application')} />
    </main>
  )
}
