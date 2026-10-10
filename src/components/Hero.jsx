import { withBase } from '../basePath'
import { CAN_FLASH } from '../platform.js'

export default function Hero() {
  return (
    <section id="top" className="hero">
      <div className="container hero-inner">
        <div className="hero-copy">
          <p className="eyebrow">ESP32 · LoRa mesh · GPL-3.0</p>
          <h1>Meshtastic without the phone</h1>
          <p className="lede">
            Camillia is mesh radio firmware for twelve ESP32 boards. Ten named
            channels, direct messages, GPS, and a config UI you open in a
            browser — all of it running on the device, whether you drive it with
            a keyboard, a roller wheel, a trackball, or a touchscreen.
          </p>
          <div className="hero-actions">
            {CAN_FLASH && <a className="btn" href="#flash">Flash from your browser</a>}
            <a className={CAN_FLASH ? 'btn btn-ghost' : 'btn'} href="https://github.com/oumike/camillia-mt"
               target="_blank" rel="noreferrer">View source on GitHub</a>
          </div>
          <p className="hero-spec">12 boards · 10 channels · 13 palettes · 22 languages</p>
        </div>

        <figure className="hero-screen">
          <img
            src={withBase('/screenshots/channel.png')}
            alt="The Camillia channel view: a timeline of mesh messages, each with a timestamp and sender name, above a row of keyboard shortcuts."
            width="320"
            height="240"
          />
          <figcaption>LilyGo T-Deck · 320 × 240 · Camillia dark</figcaption>
        </figure>
      </div>
    </section>
  )
}
