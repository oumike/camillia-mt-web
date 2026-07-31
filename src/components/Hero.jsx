export default function Hero() {
  return (
    <section id="top" className="hero">
      <div className="container">
        <h1>
          Camillia for Meshtastic
        </h1>
        <p className="lede">
          A Meshtastic-compatible firmware for ESP32-S3 handheld
          LoRa devices. Eight named channels, a browser-based config UI, full
          YAML import/export, GPS, direct messages, and twelve hand-tuned UI
          themes.
        </p>
        <div className="hero-actions">
          <a className="btn" href="#flash">Flash from your browser</a>
          <a className="btn btn-ghost" href="https://github.com/oumike/camillia-mt"
             target="_blank" rel="noreferrer">View source on GitHub</a>
        </div>
      </div>
    </section>
  )
}
