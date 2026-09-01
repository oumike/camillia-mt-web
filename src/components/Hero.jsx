import { withBase } from '../basePath'

export default function Hero() {
  return (
    <section id="top" className="hero">
      <div className="container hero-inner">
        <div className="hero-copy">
          <p className="eyebrow">ESP32-S3 · SX1262 LoRa · GPL-3.0</p>
          <h1>Meshtastic without the phone</h1>
          <p className="lede">
            Camillia is mesh radio firmware for eight ESP32-S3 boards. Eight named
            channels, direct messages, GPS, and a config UI you open in a
            browser — all of it running on the device, whether you drive it with
            a keyboard, a roller wheel, a trackball, or a touchscreen.
          </p>
          <div className="hero-actions">
            <a className="btn" href="#flash">Flash from your browser</a>
            <a className="btn btn-ghost" href="https://github.com/oumike/camillia-mt"
               target="_blank" rel="noreferrer">View source on GitHub</a>
          </div>
          <p className="hero-spec">8 boards · 8 channels · 13 palettes</p>
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
