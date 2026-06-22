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
  return (
    <section id="screenshots">
      <div className="container">
        <h2>On the device</h2>
        <p>
          Captures from a LilyGo T-Deck running the Crimson Blue Dark theme.
          The interface is keyboard-first but works equally well with the
          trackball, roller wheel, or touch — same primitives across every
          build profile.
        </p>
        <div className="shots-grid">
          {SHOTS.map(s => (
            <figure key={s.src} className="shot">
              <img src={s.src} alt={s.title} loading="lazy" width="320" height="240" />
              <figcaption>
                <strong>{s.title}</strong>
                <span>{s.caption}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
