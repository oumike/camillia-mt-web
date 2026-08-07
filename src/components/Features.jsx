const FEATURES = [
  {
    tag: 'Channels',
    title: 'Eight channels, independently keyed',
    body: 'Name and key each channel separately, and switch between them without losing your place in any of them. Unread counts stay per channel.',
  },
  {
    tag: 'Config',
    title: 'Set it up from a browser',
    body: 'The device hosts a Wi-Fi access point and a config page. Set node identity, region, and channel keys from a phone or laptop — no cable, no app.',
  },
  {
    tag: 'Mesh',
    title: 'Position, node info, direct messages',
    body: 'Hardware GPS, NodeInfo broadcasts, traceroute, and one-to-one messages, speaking the same Meshtastic protocol as the rest of your nodes.',
  },
  {
    tag: 'Portable',
    title: 'Config that moves between devices',
    body: 'Export the whole configuration to YAML on microSD and import it on another board. Settings survive reboots and reflashes.',
  },
]

export default function Features() {
  return (
    <section id="features">
      <div className="container">
        <p className="eyebrow">What it does</p>
        <h2>A stand-alone mesh client</h2>
        <div className="grid feature-grid">
          {FEATURES.map(f => (
            <div className="panel" key={f.title}>
              <span className="tag">{f.tag}</span>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
