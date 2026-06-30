import { DEVICES } from '../devices.js'

export default function Devices() {
  return (
    <section id="devices">
      <div className="container">
        <h2>Supported devices</h2>
        <div className="grid devices-grid" style={{ marginTop: 28 }}>
          {DEVICES.map(d => (
            <div className="device" key={d.env}>
              <span className="name">
                <a href={d.link} target="_blank" rel="noreferrer">{d.name}</a>
              </span>
              <span className="desc">{d.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
