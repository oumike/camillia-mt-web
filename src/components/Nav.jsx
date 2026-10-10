import { useEffect, useState } from 'react'
import { withBase } from '../basePath'
import ModeToggle from './ModeToggle.jsx'
import { CAN_FLASH } from '../platform.js'

// The device navigates by single keypress, so the site does too. `key` is both
// the shortcut and the bracketed letter shown in the link, exactly like the
// firmware's footer legend.
const SECTIONS = {
  mt: [
    { key: 'd', label: 'evices',     href: '#devices' },
    { key: 's', label: 'creenshots', href: '#screenshots' },
    { key: 't', label: 'hemes',      href: '#themes' },
    { key: 'f', label: 'lash',       href: '#flash' },
  ],
  cs: [
    { key: 'd', label: 'evices',     href: '#devices' },
    { key: 'f', label: 'lash',       href: '#flash' },
  ],
}

// No flasher on iOS (see platform.js), so no shortcut to it either.
if (!CAN_FLASH) {
  for (const page of Object.keys(SECTIONS)) {
    SECTIONS[page] = SECTIONS[page].filter(l => l.href !== '#flash')
  }
}

const REPOS = {
  mt: 'oumike/camillia-mt',
  cs: 'oumike/camillia-chat-server',
}

function externalLinks(repo) {
  return [
    { label: 'Releases', href: `https://github.com/${repo}/releases` },
    { label: 'License',  href: `https://github.com/${repo}/blob/main/LICENSE.md` },
    { label: 'GitHub',   href: `https://github.com/${repo}` },
  ]
}

// One brand per firmware, each a plain link to its page (a full load: the two
// pages share nothing but the theme, which lives in localStorage). On its own
// page a brand scrolls back to the top instead.
const BRANDS = [
  { page: 'mt', suffix: '/mt', path: '/' },
  { page: 'cs', suffix: '/cs', path: '/cs/' },
]

function isTypingTarget(el) {
  if (!el) return false
  if (el.isContentEditable) return true
  return ['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)
}

export default function Nav({ page, mode, modeLocked, onModeChange }) {
  const [open, setOpen] = useState(false)
  const links = SECTIONS[page]
  const external = externalLinks(REPOS[page])

  useEffect(() => {
    const onKeyDown = e => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isTypingTarget(e.target)) return
      if (document.querySelector('[role="dialog"]')) return
      const hit = links.find(l => l.key === e.key.toLowerCase())
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
  }, [links])

  return (
    <header className="nav">
      <div className="nav-inner">
        <img className="brand-mark" src={withBase('/favicon.svg')} alt="" width="28" height="28" />
        <div className="brands">
          {BRANDS.map(b => (
            <a
              key={b.page}
              href={b.page === page ? '#top' : withBase(b.path)}
              className="brand"
              aria-current={b.page === page ? 'page' : undefined}
            >
              <span><span className="brand-word">Camillia</span><span className="brand-dim">{b.suffix}</span></span>
            </a>
          ))}
        </div>

        <div className="nav-spacer" />

        <nav className={open ? 'nav-links nav-links-open' : 'nav-links'}
             aria-label="Sections">
          <ul role="list">
            {links.map(l => (
              <li key={l.key}>
                <a href={l.href} onClick={() => setOpen(false)}>
                  (<b>{l.key.toUpperCase()}</b>){l.label}
                </a>
              </li>
            ))}
          </ul>
          <ul role="list" className="nav-external">
            {external.map(l => (
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
