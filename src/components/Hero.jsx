import DeviceScreen from './DeviceScreen.jsx'

export default function Hero() {
  return (
    <section id="top" className="hero">
      <div className="container hero-inner">
        <div className="hero-copy">
          <p className="eyebrow">ESP32-S3 · SX1262 LoRa · GPL-3.0</p>
          <h1>Meshtastic without the phone</h1>
          <p className="lede">
            Camillia is mesh radio firmware for six ESP32-S3 boards. Eight named
            channels, direct messages, GPS, and a config UI you open in a
            browser — all of it running on the device, whether you drive it with
            a keyboard, a roller wheel, a trackball, or a touchscreen.
          </p>
          <div className="hero-actions">
            <a className="btn" href="#flash">Flash from your browser</a>
            <a className="btn btn-ghost" href="https://github.com/oumike/camillia-mt"
               target="_blank" rel="noreferrer">View source on GitHub</a>
          </div>
          <p className="hero-spec">6 boards · 8 channels · 13 palettes</p>
        </div>

        <div className="hero-screen">
          <DeviceScreen live />
          <p className="hero-screen-note">
            Live render of the channel view, in the theme you have selected.
          </p>
        </div>
      </div>
    </section>
  )
}
