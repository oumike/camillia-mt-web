const FEATURES = [
  {
    tag: 'Channels',
    title: '8 configurable LoRa channels',
    body: 'Each channel is independently named, keyed, and color-coded — switch between work, neighborhood, and rescue traffic without losing context.',
  },
  {
    tag: 'Announcements',
    title: 'Read-only ANN feed',
    body: 'Join/leave events and channel activity collected in one tab, so you can see who is around without scrolling DMs.',
  },
  {
    tag: 'Web config',
    title: 'Wi-Fi AP browser UI',
    body: 'On first boot the device hosts a Wi-Fi access point and config UI at http://192.168.4.1 — set node identity, region, and channel keys from any phone or laptop.',
  },
  {
    tag: 'Storage',
    title: 'YAML on microSD',
    body: 'All settings and channel keys round-trip through /camillia/config.yaml on the microSD card. Clone a node by copying a file.',
  },
  {
    tag: 'GPS + DMs',
    title: 'Position and direct messages',
    body: 'Hardware GPS support, NodeInfo broadcasts, and 1-to-1 direct messages with the same Meshtastic protocol your other nodes already speak.',
  },
  {
    tag: 'Themes',
    title: '12 themes × dark/light',
    body: 'From the signature pink Camillia palette to Solarized, Scarlet Pop, Ink Wash, and more. Pick one below and the site will switch with you.',
  },
]

export default function Features() {
  return (
    <section id="features">
      <div className="container">
        <h2>Features</h2>
        <p>Everything below works today on shipping hardware.</p>
        <div className="grid" style={{ marginTop: 28 }}>
          {FEATURES.map(f => (
            <div className="card" key={f.title}>
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
