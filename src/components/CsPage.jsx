import Devices from './Devices.jsx'
import Flasher from './Flasher.jsx'
import Docs from './Docs.jsx'
import { CS_DEVICES } from '../devices.js'
import { CS_FIRMWARE } from '../firmware.js'

// The camillia chat server's page. Facts here come from camillia-chat-server's
// design doc (docs/superpowers/specs) and its platformio.ini; keep them in step
// when the firmware changes.

// The status page the plain V4 draws on its OLED (status_display_oled.cpp),
// line for line. Values are illustrative.
const OLED_LINES = [
  'Camillia Chat Server',
  'Camillia CS 3f2a',
  'AP 192.168.4.1',
  'MQTT: off',
  'Stored: 412 messages',
]

function CsHero() {
  return (
    <section id="top" className="hero">
      <div className="container hero-inner">
        <div className="hero-copy">
          <p className="eyebrow">ESP32-S3 · LoRa mesh · Chat server</p>
          <h1>Catch up on what you missed</h1>
          <p className="lede">
            Camillia Chat Server turns a Heltec V4 into an always-on listener
            for your Meshtastic channels. It keeps the recent history of each
            one, and when a Camillia-MT node comes back on air it sends that
            node whatever it missed — paced, so the catch-up never floods the
            mesh.
          </p>
          <div className="hero-actions">
            <a className="btn" href="#flash">Flash from your browser</a>
            <a className="btn btn-ghost" href={`https://github.com/${CS_FIRMWARE.repo}`}
               target="_blank" rel="noreferrer">View source on GitHub</a>
          </div>
          <p className="hero-spec">2 builds · 10 channels · 250 messages each · LoRa + MQTT</p>
        </div>

        <figure className="hero-screen">
          <div className="oled" role="img"
               aria-label="The chat server's status page: its name, address, MQTT state, and how many messages it holds.">
            {OLED_LINES.map(l => <span key={l}>{l}</span>)}
          </div>
          <figcaption>Heltec WiFi LoRa 32 V4 · 128 × 64 OLED · status page</figcaption>
        </figure>
      </div>
    </section>
  )
}

const FEATURES = [
  {
    tag: 'Listen',
    title: 'On your mesh, not beside it',
    body: 'The server sits on the same region, preset, and frequency slot as the mesh it serves, so it hears what your nodes hear and stock Meshtastic nodes relay its replies. MQTT can feed it too, receive only: it never publishes.',
  },
  {
    tag: 'Store',
    title: 'Ten channels, 250 messages each',
    body: 'Channel text messages are kept in PSRAM and saved to flash, so a power cut does not lose history. A message heard over both LoRa and MQTT, or relayed several times, is stored once. Direct messages are never stored.',
  },
  {
    tag: 'Discover',
    title: 'Found automatically, or picked by hand',
    body: 'Camillia-MT nodes find a server on a shared discovery channel and use the first one that carries their channels. Pick one yourself from the node list and it is never replaced.',
  },
  {
    tag: 'Replay',
    title: 'Only what you missed',
    body: 'Each node keeps a cursor per channel, so a returning node gets only the messages after the last one it saw, in small paced batches. Lost packets show up as gaps and are asked for again.',
  },
  {
    tag: 'Keys',
    title: 'History stays with the key',
    body: 'Requests and replies travel on the channel being synced, under that channel’s own key. A node that cannot read a channel cannot ask for its history either.',
  },
  {
    tag: 'Config',
    title: 'Set it up from a browser',
    body: 'The server hosts its own Wi-Fi access point and config page: radio, channels, pacing, MQTT, live status, and a stored-message viewer per channel. Back the whole config up to YAML and restore it.',
  },
]

function CsFeatures() {
  return (
    <section id="features">
      <div className="container">
        <p className="eyebrow">What it does</p>
        <h2>Store and replay, for Camillia</h2>
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

const STEPS = [
  {
    title: 'Join the server’s network',
    body: <>After flashing, the server hosts an open Wi-Fi access point named <span className="kbd">camillia-cs-&lt;short name&gt;</span>. Its address is on the server’s screen.</>,
  },
  {
    title: 'Match it to your mesh',
    body: <>Go to <a href="http://192.168.4.1">192.168.4.1</a>. Set the region, preset, and frequency slot your mesh uses, then add each channel to keep, with exactly the same name and key your nodes use.</>,
  },
  {
    title: 'Turn it on in Camillia-MT',
    body: <>The client is off by default. On each node, set <span className="kbd">Chat Server</span> in the device config to Automatic, or open the server in the node list and choose <span className="kbd">Chat Server</span>.</>,
  },
]

export default function CsPage() {
  return (
    <>
      <CsHero />
      <CsFeatures />
      <Devices
        devices={CS_DEVICES}
        title="One board, two builds"
        intro="Both builds run on the Heltec WiFi LoRa 32 V4. The expansion kit takes over the pins the OLED uses, so it is a separate build rather than a setting. Pick yours in the flasher."
      />
      <Flasher product={CS_FIRMWARE} devices={CS_DEVICES} />
      <Docs steps={STEPS} title="Three steps to a server on the mesh" />
    </>
  )
}
