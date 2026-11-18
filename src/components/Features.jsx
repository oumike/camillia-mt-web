const FEATURES = [
  {
    title: 'Channels',
    body: 'Name and key each channel separately, give each its own hop limit, and switch between them without losing your place. Unread counts stay per channel. Stock Meshtastic nodes still interoperate, and the ESP32 Cardputer keeps eight.',
  },
  {
    title: 'Browser setup',
    body: 'The device hosts a Wi-Fi access point and a config page, or serves it on your own network. Set node identity, region, and channel keys from a phone or laptop — no cable, no app.',
  },
  {
    title: 'Position, node info, and direct messages',
    body: 'Hardware GPS, NodeInfo broadcasts, traceroute, signed packets, and one-to-one messages, speaking the same Meshtastic protocol as the rest of your nodes. It can also catch up from a Store and Forward router.',
  },
  {
    title: 'Maps and line of sight',
    body: 'Locate opens an OpenStreetMap view of any node’s last position, using offline tiles first. Terrain line of sight shows whether the ground between you and a node is likely to block the path, and where.',
  },
  {
    title: 'Live traffic, discovery, weather, and MQTT',
    body: 'A filterable live RX/TX feed, neighbor discovery, beacons, current local weather, and an MQTT monitor that shows which channels a broker is carrying.',
  },
  {
    title: 'Remote admin and VNC',
    body: 'Read and change the config of another Meshtastic node from a terminal, once it trusts your key. Browser VNC mirrors the device screen in a web page and sends taps and keys back.',
  },
  {
    title: 'Languages',
    body: 'The on-device interface comes in English plus 21 translations, from Español and Deutsch to Lietuvių and Eesti. The ESP32 Cardputer is English-only; the CardputerZero has them all.',
  },
  {
    title: 'Config export and import',
    body: 'Export the whole configuration to YAML on microSD, or internal flash on boards without a card, and import it on another board. Tick Append date to keep several dated backups side by side. Settings survive reboots and reflashes.',
  },
]

export default function Features() {
  return (
    <section id="features">
      <div className="container">
        <h2>Features</h2>
        <div className="feature-grid">
          {FEATURES.map(f => (
            <div className="feature" key={f.title}>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
