import { CAN_FLASH } from '../platform.js'
import ChatStyleToggle, { chatShot } from './ChatStyleToggle.jsx'

export default function Hero({ chatStyle, onChatStyleChange }) {
  return (
    <section id="top" className="hero">
      <div className="container hero-inner">
        <div className="hero-copy">
          <h1>Camillia for Meshtastic</h1>
          <p className="lede">
            Camillia is mesh radio firmware for thirteen ESP32 boards. Ten named
            channels, direct messages, GPS, and a config UI you open in a
            browser — all of it running on the device, whether you drive it with
            a keyboard, a roller wheel, a trackball, or a touchscreen.
          </p>
          <div className="hero-actions">
            {CAN_FLASH && <a className="btn" href="#flash">Flash from your browser</a>}
            <a className={CAN_FLASH ? 'btn btn-ghost' : 'btn'} href="https://github.com/oumike/camillia-mt"
               target="_blank" rel="noreferrer">View source on GitHub</a>
          </div>
        </div>

        <figure className="hero-screen">
          <img
            src={chatShot(chatStyle, 'channel')}
            alt="The Camillia channel view: a timeline of mesh messages, each with a timestamp and sender name, above the bottom navigation bar."
            width="320"
            height="240"
          />
          <ChatStyleToggle style={chatStyle} onChange={onChatStyleChange} size="sm" />
          <figcaption>The channel view on a LilyGo T-Deck, captured at its native 320 × 240.</figcaption>
        </figure>
      </div>
    </section>
  )
}
