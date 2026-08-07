import { useEffect, useState } from 'react'
import { withBase } from '../basePath'
import ModeToggle from './ModeToggle.jsx'

// The device navigates by single keypress, so the site does too. `key` is both
// the shortcut and the bracketed letter shown in the link, exactly like the
// firmware's footer legend.
const LINKS = [
  { key: 'd', label: 'evices',     href: '#devices' },
  { key: 's', label: 'creenshots', href: '#screenshots' },
  { key: 't', label: 'hemes',      href: '#themes' },
  { key: 'f', label: 'lash',       href: '#flash' },
]

const EXTERNAL = [
  { label: 'Releases', href: 'https://github.com/oumike/camillia-mt/releases' },
  { label: 'License',  href: 'https://github.com/oumike/camillia-mt/blob/main/LICENSE.md' },
  { label: 'GitHub',   href: 'https://github.com/oumike/camillia-mt' },
]

function isTypingTarget(el) {
  if (!el) return false
  if (el.isContentEditable) return true
  return ['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)
}

export default function Nav({ mode, modeLocked, onModeChange }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = e => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isTypingTarget(e.target)) return
      if (document.querySelector('[role="dialog"]')) return
      const hit = LINKS.find(l => l.key === e.key.toLowerCase())
      if (!hit) return
      const target = document.querySelector(hit.href)
      if (!target) return
      e.preventDefault()
      setOpen(false)
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      target.setAttribute('tabindex', '-1')
      target.focus({ preventScroll: true })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <header className="nav">
      <div className="nav-inner">
        <a href="#top" className="brand">
          <img src={withBase('/favicon.svg')} alt="" width="28" height="28" />
          <span>Camillia<span className="brand-dim">/mt</span></span>
        </a>

        <div className="nav-spacer" />

        <nav className={open ? 'nav-links nav-links-open' : 'nav-links'}
             aria-label="Sections">
          <ul role="list">
            {LINKS.map(l => (
              <li key={l.key}>
                <a href={l.href} onClick={() => setOpen(false)}>
                  (<b>{l.key.toUpperCase()}</b>){l.label}
                </a>
              </li>
            ))}
          </ul>
          <ul role="list" className="nav-external">
            {EXTERNAL.map(l => (
              <li key={l.label}>
                <a href={l.href} target="_blank" rel="noreferrer">{l.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <ModeToggle mode={mode} locked={modeLocked} onChange={onModeChange} size="sm" />

        <button
          type="button"
          className="nav-burger"
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen(v => !v)}
        >
          <span /><span /><span />
        </button>
      </div>
    </header>
  )
}
