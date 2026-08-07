const STEPS = [
  {
    title: 'Join the setup network',
    body: <>After the first boot the device hosts a Wi-Fi access point called <span className="kbd">camillia-mt</span>. Connect to it from a phone or laptop.</>,
  },
  {
    title: 'Open the config page',
    body: <>Go to <a href="http://192.168.4.1">192.168.4.1</a>. The device serves the page itself, so you do not need an internet connection.</>,
  },
  {
    title: 'Set identity, region, and keys',
    body: <>Choose a node name, pick the LoRa region for where you are, and enter your channel keys. Everything persists across reboots.</>,
  },
]

export default function Docs() {
  return (
    <section id="docs" className="band">
      <div className="container">
        <p className="eyebrow">First run</p>
        <h2>Three steps to a node on the mesh</h2>
        <ol className="steps" role="list">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span className="step-n">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
