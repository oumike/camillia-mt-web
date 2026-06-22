import { useEffect, useMemo, useState } from 'react'
import 'esp-web-tools'
import { DEVICES } from '../devices.js'
import {
  FIRMWARE_VERSION,
  latestVersion,
  manifestDataUrl,
  firmwareUrl,
} from '../firmware.js'

function serialSupported() {
  return typeof navigator !== 'undefined' && 'serial' in navigator
}

export default function Flasher() {
  const [supported, setSupported] = useState(true)
  const [env, setEnv] = useState(DEVICES[0].env)
  const [version, setVersion] = useState(null)
  const [versionStale, setVersionStale] = useState(false)

  useEffect(() => setSupported(serialSupported()), [])

  useEffect(() => {
    let cancelled = false
    latestVersion()
      .then(tag => { if (!cancelled) setVersion(tag) })
      .catch(() => {
        if (!cancelled) {
          setVersion(FIRMWARE_VERSION)
          setVersionStale(true)
        }
      })
    return () => { cancelled = true }
  }, [])

  const device = useMemo(
    () => DEVICES.find(d => d.env === env) ?? DEVICES[0],
    [env]
  )

  const manifestUrl = useMemo(
    () => version ? manifestDataUrl(device, version) : null,
    [device.env, version]
  )

  return (
    <section id="flash">
      <div className="container">
        <h2>Flash from your browser</h2>
        <p>
          Plug your ESP32-S3 device in over USB, pick its build profile below,
          and the page will write the latest firmware directly. No{' '}
          <span className="kbd">esptool</span>, no command line.
        </p>
        {!supported && (
          <div className="card" style={{ marginTop: 16, borderColor: 'var(--accent)' }}>
            <strong>Web Serial isn't available in this browser.</strong>{' '}
            Use a recent Chrome, Edge, or Opera on desktop. iOS Safari and
            Firefox don't expose Web Serial — on those, download the{' '}
            <span className="kbd">.bin</span> and use{' '}
            <span className="kbd">flash.sh</span> from the command line.
          </div>
        )}
        <div className="device flasher" style={{ marginTop: 28 }}>
          <label className="flasher-select">
            <span>Device</span>
            <select value={env} onChange={e => setEnv(e.target.value)}>
              {DEVICES.map(d => (
                <option key={d.env} value={d.env}>
                  {d.name} — env:{d.env}
                </option>
              ))}
            </select>
          </label>
          <span className="desc">{device.desc}</span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 12 }}>
            {manifestUrl ? (
              <>
                <esp-web-install-button key={`${device.env}-${version}`} manifest={manifestUrl}>
                  <button slot="activate" className="btn">Flash {version}</button>
                  <span slot="unsupported" className="browser-note">
                    Your browser does not support Web Serial. Use Chrome, Edge, or Opera on desktop.
                  </span>
                  <span slot="not-allowed" className="browser-note">
                    Web Serial requires a secure (https://) connection.
                  </span>
                </esp-web-install-button>
                <a className="btn btn-ghost" href={firmwareUrl(device.env, version)} download>
                  Download .bin
                </a>
              </>
            ) : (
              <button className="btn" disabled>Checking latest release…</button>
            )}
          </div>
          {versionStale && (
            <span className="browser-note" style={{ marginTop: 8 }}>
              Couldn't reach the GitHub API — falling back to {FIRMWARE_VERSION}.
            </span>
          )}
        </div>
      </div>
    </section>
  )
}
