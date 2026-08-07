import { useEffect, useState } from 'react'
import { THEMES, applyTheme, isDarkOnly } from './themes.js'
import Hero from './components/Hero.jsx'
import Features from './components/Features.jsx'
import Devices from './components/Devices.jsx'
import Screenshots from './components/Screenshots.jsx'
import ThemeRail from './components/ThemeRail.jsx'
import Flasher from './components/Flasher.jsx'
import Docs from './components/Docs.jsx'
import Nav from './components/Nav.jsx'
import Footer from './components/Footer.jsx'
import AI from './components/AI.jsx'

const STORAGE_KEY = 'camillia-theme'

function loadInitial() {
  if (typeof window === 'undefined') return { id: 'camellia', mode: 'dark' }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (THEMES.find(t => t.id === parsed.id)) return parsed
    }
  } catch {}
  return { id: 'camellia', mode: 'dark' }
}

export default function App() {
  const [theme, setTheme] = useState(loadInitial)

  useEffect(() => {
    applyTheme(document.documentElement, theme.id, theme.mode)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(theme)) } catch {}
  }, [theme])

  // Dark-only themes keep the stored preference but always render dark, so
  // switching back to a two-mode theme restores what the user last chose.
  const modeLocked = isDarkOnly(theme.id)
  const mode = modeLocked ? 'dark' : theme.mode
  const setMode = next => setTheme(t => ({ ...t, mode: next }))

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <Nav mode={mode} modeLocked={modeLocked} onModeChange={setMode} />
      <main id="main">
        <Hero />
        <Features />
        <Devices />
        <Screenshots />
        <ThemeRail
          theme={theme}
          mode={mode}
          modeLocked={modeLocked}
          onModeChange={setMode}
          onThemeChange={setTheme}
        />
        <Flasher />
        <Docs />
        <AI />
      </main>
      <Footer />
    </>
  )
}
