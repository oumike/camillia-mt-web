import Devices from './Devices.jsx'
import Flasher from './Flasher.jsx'
import Docs from './Docs.jsx'
import { CS_DEVICES } from '../devices.js'
import { CS_FIRMWARE } from '../firmware.js'
import { CAN_FLASH } from '../platform.js'

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
          <h1>Camillia Chat Server</h1>
          <p className="lede">
            Camillia Chat Server turns almost any board Camillia-MT runs on into an always-on listener
            for your Meshtastic channels. It keeps the recent history of each
            one, and when a Camillia-MT node comes back on air it sends that
            node whatever it missed — paced, so the catch-up never floods the
            mesh.
          </p>
          <div className="hero-actions">
            {CAN_FLASH && <a className="btn" href="#flash">Flash from your browser</a>}
            <a className={CAN_FLASH ? 'btn btn-ghost' : 'btn'} href={`https://github.com/${CS_FIRMWARE.repo}`}
               target="_blank" rel="noreferrer">View source on GitHub</a>
          </div>
        </div>

        <figure className="hero-screen">
          <div className="oled" role="img"
               aria-label="The chat server's status page: its name, address, MQTT state, and how many messages it holds.">
            {OLED_LINES.map(l => <span key={l}>{l}</span>)}
          </div>
          <figcaption>The status page on a Heltec V4’s 128 × 64 OLED.</figcaption>
        </figure>
      </div>
    </section>
  )
}

const FEATURES = [
  {
    title: 'Radio and MQTT',
    body: 'The server sits on the same region, preset, and frequency slot as the mesh it serves, so it hears what your nodes hear and stock Meshtastic nodes relay its replies. MQTT can feed it too, receive only: it never publishes.',
  },
  {
    title: 'Message storage',
    body: 'Channel text messages are kept in PSRAM and saved to flash, so a power cut does not lose history. A message heard over both LoRa and MQTT, or relayed several times, is stored once. Direct messages are never stored.',
  },
  {
    title: 'Server discovery',
    body: 'Camillia-MT nodes find a server on a shared discovery channel and use the first one that carries their channels. Pick one yourself from the node list and it is never replaced.',
  },
  {
    title: 'Catch-up replay',
    body: 'Each node keeps a cursor per channel, so a returning node gets only the messages after the last one it saw, in small paced batches. Lost packets show up as gaps and are asked for again.',
  },
  {
    title: 'Channel keys',
    body: 'Requests and replies travel on the channel being synced, under that channel’s own key. A node that cannot read a channel cannot ask for its history either.',
  },
  {
    title: 'Browser setup',
    body: 'The server hosts its own Wi-Fi access point and config page: radio, channels, pacing, MQTT, live status, and a stored-message viewer per channel. Back the whole config up to YAML and restore it.',
  },
]

function CsFeatures() {
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
        title="Supported boards"
        intro={`Every board Camillia-MT supports can run the server except the Cardputer, which has no PSRAM for the message store. The Heltec V4 gets two builds: the expansion kit takes over the pins the OLED uses, so it is a separate build rather than a setting. Screens of 320×240 and larger show the same health, message feed and activity pages, scaled up; the T-Deck Pro's e-paper shows a plain status page.${CAN_FLASH ? ' Pick yours in the flasher.' : ''}`}
      />
      {CAN_FLASH && <Flasher product={CS_FIRMWARE} devices={CS_DEVICES} customize="cs" />}
      <Docs steps={STEPS} title="First-time setup" />
    </>
  )
}
