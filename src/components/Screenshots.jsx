import { useEffect, useRef, useState } from 'react'
import { withBase } from '../basePath'

const LEAD = [
  { src: withBase('/screenshots/channel.png'), title: 'Channel view',     caption: 'An IRC-style timeline: per-message timestamps, channel-colored nicks, and the key legend always in reach.' },
  { src: withBase('/screenshots/nodes.png'),   title: 'Node detail',      caption: 'Long and short name, hops, SNR, last position, and last heard — for all 89 nodes in range.' },
  { src: withBase('/screenshots/config.png'),  title: 'On-device config', caption: 'Theme, Wi-Fi config UI, GPS, and notification sounds, changed on the device without reflashing.' },
]

const REST = [
  { src: withBase('/screenshots/bubbles.png'),      title: 'Bubble chat',      caption: 'The same timeline as bubbles, with your messages right-aligned in the accent color.' },
  { src: withBase('/screenshots/channels.png'),     title: 'Channel switcher', caption: 'Move between all eight channels, each independently keyed.' },
  { src: withBase('/screenshots/dm.png'),           title: 'Direct messages',  caption: 'One-to-one conversations addressed by node ID, kept in their own tab.' },
  { src: withBase('/screenshots/compose.png'),      title: 'Compose',          caption: 'Enter sends, Backspace on an empty line cancels.' },
  { src: withBase('/screenshots/emoji.png'),        title: 'Emoji picker',     caption: 'Arrows to move, Enter to insert, Backspace to close.' },
  { src: withBase('/screenshots/node-actions.png'), title: 'Node actions',     caption: 'Traceroute, DM, favorite, request info or position, or ignore a node.' },
  { src: withBase('/screenshots/live.png'),         title: 'Live traffic',     caption: 'Real-time RX and TX across every channel, for debugging and demos.' },
]

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

function Shot({ shot, onOpen, size }) {
  return (
    <figure className={`shot shot-${size}`}>
      <button
        className="shot-open"
        type="button"
        onClick={() => onOpen(shot)}
        aria-label={`Enlarge ${shot.title}`}
      >
        <img src={shot.src} alt={shot.title} loading="lazy" width="320" height="240" />
      </button>
      <figcaption>
        <strong>{shot.title}</strong>
        <span>{shot.caption}</span>
      </figcaption>
    </figure>
  )
}

export default function Screenshots() {
  const [activeShot, setActiveShot] = useState(null)
  const panelRef = useRef(null)
  const closeRef = useRef(null)
  const returnRef = useRef(null)

  function open(shot) {
    returnRef.current = document.activeElement
    setActiveShot(shot)
  }

  function close() {
    setActiveShot(null)
  }

  // Lock the page behind the dialog, trap Tab inside it, and hand focus back
  // to the thumbnail that opened it.
  useEffect(() => {
    if (!activeShot) return undefined

    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const onKeyDown = e => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
        return
      }
      if (e.key !== 'Tab') return
      const items = panelRef.current?.querySelectorAll(FOCUSABLE)
      if (!items?.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflow
      returnRef.current?.focus?.()
    }
  }, [activeShot])

  return (
    <section id="screenshots">
      <div className="container">
        <p className="eyebrow">On the device</p>
        <h2>Sample Screens</h2>
        <p className="measure">
          Captured from a LilyGo T-Deck running the Camillia dark theme. The
          same screens render on every board, driven by keyboard, trackball,
          roller wheel, or touch.
        </p>

        <div className="shots-lead">
          {LEAD.map(s => <Shot key={s.src} shot={s} onOpen={open} size="lead" />)}
        </div>

        <div className="shots-rest">
          {REST.map(s => <Shot key={s.src} shot={s} onOpen={open} size="rest" />)}
        </div>

        {activeShot && (
          <div
            className="shot-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={activeShot.title}
            onClick={close}
          >
            <div className="shot-lightbox-panel" ref={panelRef} onClick={e => e.stopPropagation()}>
              <button
                type="button"
                ref={closeRef}
                className="shot-lightbox-close"
                onClick={close}
              >
                Close
              </button>
              <img src={activeShot.src} alt={activeShot.title} width="1280" height="960" />
              <div className="shot-lightbox-caption">
                <strong>{activeShot.title}</strong>
                <span>{activeShot.caption}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
