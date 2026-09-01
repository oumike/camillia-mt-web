import { DEVICES } from '../devices.js'

export default function Devices() {
  return (
    <section id="devices" className="band">
      <div className="container">
        <p className="eyebrow">Hardware</p>
        <h2>Eight boards, one firmware</h2>
        <p className="measure">
          Every profile below is built from the same source tree. Pick your
          board in the flasher and it writes the matching build. Board names go
          to the manufacturer; buy links go to Rokland where they stock it.
        </p>

        <div className="grid device-grid">
          {DEVICES.map(d => (
            <article className="panel device" key={d.env}>
              <header className="device-head">
                <h3>
                  {d.link
                    ? <a href={d.link} target="_blank" rel="noreferrer">{d.name}</a>
                    : d.name}
                </h3>
                <span className="device-env">{d.env}</span>
              </header>
              {d.desc && <p>{d.desc}</p>}
              <p className="device-foot">
                {d.chip && <span className="device-chip">{d.chip}</span>}
                {d.buy && (
                  <a className="device-buy" href={d.buy.href}
                     target="_blank" rel="noreferrer">
                    Buy at {d.buy.seller} <span aria-hidden="true">→</span>
                  </a>
                )}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
