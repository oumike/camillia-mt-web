const FEATURES = [
  {
    tag: 'Channels',
    title: 'Ten channels, independently keyed',
    body: 'Name and key each channel separately, give each its own hop limit, and switch between them without losing your place. Unread counts stay per channel. Stock Meshtastic nodes still interoperate, and the Cardputer keeps eight.',
  },
  {
    tag: 'Config',
    title: 'Set it up from a browser',
    body: 'The device hosts a Wi-Fi access point and a config page. Set node identity, region, and channel keys from a phone or laptop — no cable, no app.',
  },
  {
    tag: 'Mesh',
    title: 'Position, node info, direct messages',
    body: 'Hardware GPS, NodeInfo broadcasts, traceroute, signed packets, and one-to-one messages, speaking the same Meshtastic protocol as the rest of your nodes. It can also catch up from a Store and Forward router.',
  },
  {
    tag: 'Maps',
    title: 'Maps and line of sight',
    body: 'Locate opens an OpenStreetMap view of any node’s last position, using offline tiles first. Terrain line of sight shows whether the ground between you and a node is likely to block the path, and where.',
  },
  {
    tag: 'Tools',
    title: 'Live traffic, discovery, weather, MQTT',
    body: 'A filterable live RX/TX feed, neighbor discovery, beacons, current local weather, and an MQTT monitor that shows which channels a broker is carrying.',
  },
  {
    tag: 'Remote',
    title: 'Admin terminal and browser VNC',
    body: 'Read and change the config of another Meshtastic node from a terminal, once it trusts your key. Browser VNC mirrors the device screen in a web page and sends taps and keys back.',
  },
  {
    tag: 'Language',
    title: 'Twenty-two languages',
    body: 'The on-device interface comes in English plus 21 translations, from Español and Deutsch to Lietuvių and Eesti. The Cardputer is English-only.',
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
