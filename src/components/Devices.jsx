export default function Devices({ devices, title, intro }) {
  return (
    <section id="devices" className="band">
      <div className="container">
        <h2>{title}</h2>
        <p className="measure">{intro}</p>

        <ul className="device-list" role="list">
          {devices.map((d) => (
            <li className="device" key={d.env}>
              <div className="device-head">
                <h3>
                  {d.link ? (
                    <a href={d.link} target="_blank" rel="noreferrer">
                      {d.name}
                    </a>
                  ) : (
                    d.name
                  )}
                </h3>
                <code className="device-env">{d.env}</code>
              </div>
              {d.desc && <p className="device-desc">{d.desc}</p>}
              <p className="device-foot">
                {d.chip && <span className="device-chip">{d.chip}</span>}
                {d.buy && (
                  <a
                    className="device-buy"
                    href={d.buy.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Buy at {d.buy.seller}
                  </a>
                )}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
