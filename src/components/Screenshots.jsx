import { useEffect, useRef, useState } from 'react'
import { withBase } from '../basePath'
import ChatStyleToggle, { CHAT_STYLES, chatShot } from './ChatStyleToggle.jsx'

// `chat` shots have one capture per chat style, under screenshots/<style>/.
const LEAD = [
  { chat: 'channel', title: 'Channel view',     caption: 'Per-message timestamps, sender names, and the bottom bar for every screen, in whichever chat style you pick.' },
  { src: withBase('/screenshots/nodes.png'),   title: 'Node detail',      caption: 'Long and short name, hops, SNR, last heard, signing and position — for all 205 nodes heard.' },
  { src: withBase('/screenshots/config.png'),  title: 'On-device config', caption: 'Theme, chat style, Wi-Fi, GPS, and location sharing, changed on the device without reflashing.' },
]

const REST = [
  { src: withBase('/screenshots/channels.png'),     title: 'Channel switcher', caption: 'Move between all ten channels, each independently keyed. The list slides in from the left: tap the channel name, swipe in from the screen edge, or press C on the chat screen.' },
  { chat: 'dm',                                     title: 'Direct messages',  caption: 'One-to-one conversations with a node, kept in their own tab.' },
  { chat: 'compose',                                title: 'Compose',          caption: 'Enter sends, Backspace on an empty line cancels.' },
  { src: withBase('/screenshots/emoji.png'),        title: 'Emoji tray',       caption: 'Press E in chat: arrows to move, Enter to send, Backspace to close.' },
  { src: withBase('/screenshots/node-actions.png'), title: 'Node actions',     caption: 'Traceroute, DM, favorite, request node info or position, share, or ignore a node.' },
  { src: withBase('/screenshots/live.png'),         title: 'Live traffic',     caption: 'Real-time RX and TX across every channel, for debugging and demos.' },
]

function shotSrc(shot, style) {
  return shot.chat ? chatShot(style, shot.chat) : shot.src
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

function Shot({ shot, style, onOpen, size }) {
  const src = shotSrc(shot, style)
  return (
    <figure className={`shot shot-${size}`}>
      <button
        className="shot-open"
        type="button"
        onClick={() => onOpen(shot)}
        aria-label={`Enlarge ${shot.title}`}
      >
        <img src={src} alt={shot.title} loading="lazy" width="320" height="240" />
      </button>
      <figcaption>
        <strong>{shot.title}</strong>
        <span>{shot.caption}</span>
      </figcaption>
    </figure>
  )
}

export default function Screenshots({ chatStyle, onChatStyleChange }) {
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
        <h2>Screenshots</h2>
        <p className="measure">
          Captured from a LilyGo T-Deck running the Camillia Dark theme. The
          same screens render on every board, driven by keyboard, trackball,
          roller wheel, or touch. Chat screens come in four styles, set under
          Config → Chat Style.
        </p>

        <div className="shots-style">
          <ChatStyleToggle style={chatStyle} onChange={onChatStyleChange} />
        </div>

        <div className="shots-lead">
          {LEAD.map(s => <Shot key={s.title} shot={s} style={chatStyle} onOpen={open} size="lead" />)}
        </div>

        <div className="shots-rest">
          {REST.map(s => <Shot key={s.title} shot={s} style={chatStyle} onOpen={open} size="rest" />)}
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
              <img src={shotSrc(activeShot, chatStyle)} alt={activeShot.title} width="1280" height="960" />
              <div className="shot-lightbox-caption">
                <strong>{activeShot.chat
                  ? `${activeShot.title} · ${CHAT_STYLES.find(s => s.id === chatStyle)?.label}`
                  : activeShot.title}</strong>
                <span>{activeShot.caption}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
