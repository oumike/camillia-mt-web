import { useEffect, useState } from 'react'
import { THEMES, applyTheme } from './themes.js'
import Hero from './components/Hero.jsx'
import Features from './components/Features.jsx'
import Devices from './components/Devices.jsx'
import Screenshots from './components/Screenshots.jsx'
import Flasher from './components/Flasher.jsx'
import Docs from './components/Docs.jsx'
import Nav from './components/Nav.jsx'
import Footer from './components/Footer.jsx'
import AI from './components/AI.jsx'
import License from './components/License.jsx'

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

  return (
    <>
      <Nav theme={theme} onThemeChange={setTheme} />
      <main>
        <Hero />
        {/* <Features /> */}
        <Devices />
        <Screenshots />
        <Flasher />
        <Docs />
        <AI />
        <License />
      </main>
      <Footer />
    </>
  )
}
