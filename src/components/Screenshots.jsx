import { useEffect, useState } from 'react'

const SHOTS = [
  { src: '/screenshots/channel.png',  title: 'Channel view',        caption: 'IRC-style timeline with per-message timestamps and channel-colored nicks.' },
  { src: '/screenshots/channels.png', title: 'Channel switcher',    caption: 'Drop-down between all eight LoRa channels, each independently keyed.' },
  { src: '/screenshots/dm.png',       title: 'Direct messages',     caption: 'One-to-one conversations addressed by node ID, kept in their own tab.' },
  { src: '/screenshots/compose.png',  title: 'Compose modal',       caption: 'Lightweight modal for sending — Enter to send, Bksp on empty to cancel.' },
  { src: '/screenshots/nodes.png',    title: 'Node detail',         caption: 'Per-node info: long/short name, hops, SNR, last position and last heard.' },
  { src: '/screenshots/live.png',     title: 'Live traffic log',    caption: 'Real-time RX/TX feed across every channel for debugging and demos.' },
  { src: '/screenshots/config.png',   title: 'On-device config',    caption: 'Set theme, Wi-Fi config UI, GPS, notification sounds — no flashing required.' },
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
          Captures from a LilyGo T-Deck running the Crimson Blue Dark theme.
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
