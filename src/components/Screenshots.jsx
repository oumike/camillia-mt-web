import { useEffect, useState } from 'react'
import { withBase } from '../basePath'

const SHOTS = [
  { src: withBase('/screenshots/channel.png'),      title: 'Outline chat view',        caption: 'Outline chat style: IRC-style timeline with per-message timestamps and channel-colored nicks.' },
  { src: withBase('/screenshots/bubbles.png'),      title: 'Bubble chat style',   caption: 'Same timeline as bubbles — your messages right-aligned in the accent color.' },
  { src: withBase('/screenshots/channels.png'),     title: 'Channel switcher',    caption: 'Drop-down between all eight LoRa channels, each independently keyed.' },
  { src: withBase('/screenshots/dm.png'),           title: 'Direct messages',     caption: 'One-to-one conversations addressed by node ID, kept in their own tab.' },
  { src: withBase('/screenshots/compose.png'),      title: 'Compose messages',       caption: 'Lightweight modal for sending — Enter to send, Bksp on empty to cancel.' },
  { src: withBase('/screenshots/emoji.png'),        title: 'Emoji picker',        caption: 'Grid picker while composing — arrows to move, Enter to insert, Bksp to close.' },
  { src: withBase('/screenshots/nodes.png'),        title: 'Node detail',         caption: 'Per-node info: long/short name, hops, SNR, last position and last heard.' },
  { src: withBase('/screenshots/node-actions.png'), title: 'Node actions',        caption: 'Traceroute, DM, favorite, request info or position, or ignore a node.' },
  { src: withBase('/screenshots/live.png'),         title: 'Live traffic log',    caption: 'Real-time RX/TX feed across every channel for debugging and demos.' },
  { src: withBase('/screenshots/config.png'),       title: 'On-device config',    caption: 'Set theme, Wi-Fi config UI, GPS, notification sounds — no flashing required.' },
]

export default function Screenshots() {
  const [activeShot, setActiveShot] = useState(null)

  useEffect(() => {
    if (!activeShot) return undefined
    const onKeyDown = e => {
      if (e.key === 'Escape') setActiveShot(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeShot])

  return (
    <section id="screenshots">
      <div className="container">
        <h2>On the device</h2>
        <p>
          Captures from a LilyGo T-Deck running the Camillia Dark theme.
          The interface is keyboard-first but works equally well with the
          trackball, roller wheel, or touch — same primitives across every
          build profile.
        </p>
        <div className="shots-grid">
          {SHOTS.map(s => (
            <figure key={s.src} className="shot">
              <button
                className="shot-open"
                type="button"
                onClick={() => setActiveShot(s)}
                aria-label={`Open larger image: ${s.title}`}
              >
                <img src={s.src} alt={s.title} loading="lazy" width="320" height="240" />
              </button>
              <figcaption>
                <strong>{s.title}</strong>
                <span>{s.caption}</span>
              </figcaption>
            </figure>
          ))}
        </div>

        {activeShot && (
          <div
            className="shot-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={activeShot.title}
            onClick={() => setActiveShot(null)}
          >
            <div className="shot-lightbox-panel" onClick={e => e.stopPropagation()}>
              <button
                type="button"
                className="shot-lightbox-close"
                onClick={() => setActiveShot(null)}
                aria-label="Close screenshot preview"
              >
                Close
              </button>
              <img
                src={activeShot.src}
                alt={activeShot.title}
                width="1280"
                height="960"
              />
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
