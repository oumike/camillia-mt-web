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
import CsPage from './components/CsPage.jsx'
import { DEVICES } from './devices.js'
import { MT_FIRMWARE } from './firmware.js'
import { CAN_FLASH } from './platform.js'

const STORAGE_KEY = 'camillia-theme'

// Two pages on one bundle: <base>/cs/ is the chat server's, anything else is
// camillia-mt's. nginx and Vite already answer every unknown path with
// index.html, so the page is picked from the URL here rather than by a router.
function currentPage() {
  if (typeof window === 'undefined') return 'mt'
  const base = import.meta.env.BASE_URL || '/'
  const path = window.location.pathname
  const rel = path.startsWith(base) ? path.slice(base.length) : path.replace(/^\//, '')
  return /^cs(\/|$)/.test(rel) ? 'cs' : 'mt'
}

const TITLES = {
  mt: 'Camillia for Meshtastic',
  cs: 'Camillia Chat Server',
}

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
  const [page] = useState(currentPage)

  useEffect(() => { document.title = TITLES[page] }, [page])

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
      <Nav page={page} mode={mode} modeLocked={modeLocked} onModeChange={setMode} />
      {page === 'cs' ? (
        <main id="main">
          <CsPage />
        </main>
      ) : (
        <main id="main">
          <Hero />
          <Features />
          <Devices
            devices={DEVICES}
            title="Twelve boards, one firmware"
            intro={CAN_FLASH
              ? 'Every profile below is built from the same source tree. Pick your board in the flasher and it writes the matching build.'
              : 'Every profile below is built from the same source tree. Open this page on a desktop browser to flash one.'}
          />
          <Screenshots />
          <ThemeRail
            theme={theme}
            mode={mode}
            modeLocked={modeLocked}
            onModeChange={setMode}
            onThemeChange={setTheme}
          />
          {CAN_FLASH && <Flasher product={MT_FIRMWARE} devices={DEVICES} debugReport />}
          <Docs />
          <AI />
        </main>
      )}
      {page === 'cs' ? (
        <Footer mark="Camillia Chat Server" repo="oumike/camillia-chat-server" />
      ) : (
        <Footer mark="Camillia for Meshtastic · GPLv3" repo="oumike/camillia-mt" keys />
      )}
    </>
  )
}
