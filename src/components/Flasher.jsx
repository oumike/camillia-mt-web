import { useEffect, useMemo, useState } from 'react'
import 'esp-web-tools'
import { DEVICES } from '../devices.js'
import {
  FIRMWARE_VERSION,
  latestVersion,
  latestAlphaVersion,
  manifestDataUrl,
  firmwareUrl,
} from '../firmware.js'

function serialSupported() {
  return typeof navigator !== 'undefined' && 'serial' in navigator
}

export default function Flasher() {
  const [supported, setSupported] = useState(true)
  const [env, setEnv] = useState(DEVICES[0].env)
  const [channel, setChannel] = useState('stable')
  const [version, setVersion] = useState(null)
  const [versionStale, setVersionStale] = useState(false)
  // Alpha channel: 'loading' until the API answers, then 'ready' | 'none'.
  const [alphaVersion, setAlphaVersion] = useState(null)
  const [alphaState, setAlphaState] = useState('loading')
  const [imageFailed, setImageFailed] = useState(false)

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
    latestAlphaVersion()
      .then(tag => {
        if (!cancelled) { setAlphaVersion(tag); setAlphaState('ready') }
      })
      .catch(() => { if (!cancelled) setAlphaState('none') })
    return () => { cancelled = true }
  }, [])

  const device = useMemo(
    () => DEVICES.find(d => d.env === env) ?? DEVICES[0],
    [env]
  )

  useEffect(() => { setImageFailed(false) }, [device.env])

  // Which version the selected channel flashes. Alpha falls back to null
  // (no build available) so the button disables rather than 404s.
  const activeVersion = channel === 'alpha' ? alphaVersion : version

  const manifestUrl = useMemo(
    () => activeVersion ? manifestDataUrl(device, activeVersion) : null,
    [device.env, activeVersion]
  )

  return (
    <section id="flash">
      <div className="container">
        <h2>Flash from your browser</h2>
        <p>
          Plug your device in over USB, pick its build profile below,
          and the page will write the latest firmware directly.
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
          <div className="flasher-main">
            <label className="flasher-select">
              <span>Device</span>
              <select value={env} onChange={e => setEnv(e.target.value)}>
                {DEVICES.map(d => (
                  <option key={d.env} value={d.env}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flasher-select" style={{ marginTop: 12 }}>
              <span>Channel</span>
              <select value={channel} onChange={e => setChannel(e.target.value)}>
                <option value="stable">Stable (recommended)</option>
                <option value="alpha">Alpha (bleeding-edge)</option>
              </select>
            </label>
            {channel === 'alpha' && (
              <div className="card" style={{ marginTop: 12, borderColor: 'var(--accent)' }}>
                <strong>Alpha builds are unstable.</strong>{' '}
                These are pre-release test builds cut straight from the{' '}
                <span className="kbd">alpha</span> branch and may be broken.
                Use the Stable channel unless you're testing.
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 12 }}>
              {channel === 'alpha' && alphaState === 'loading' ? (
                <button className="btn" disabled>Checking latest alpha…</button>
              ) : channel === 'alpha' && alphaState === 'none' ? (
                <span className="browser-note">
                  No alpha build is available right now.
                </span>
              ) : manifestUrl ? (
                <>
                  <esp-web-install-button key={`${device.env}-${activeVersion}`} manifest={manifestUrl}>
                    <button slot="activate" className="btn">Flash {activeVersion}</button>
                    <span slot="unsupported" className="browser-note">
                      Your browser does not support Web Serial. Use Chrome, Edge, or Opera on desktop.
                    </span>
                    <span slot="not-allowed" className="browser-note">
                      Web Serial requires a secure (https://) connection.
                    </span>
                  </esp-web-install-button>
                  <a className="btn btn-ghost" href={firmwareUrl(device.env, activeVersion)} download>
                    Download .bin
                  </a>
                </>
              ) : (
                <button className="btn" disabled>Checking latest release…</button>
              )}
            </div>
            {channel === 'stable' && versionStale && (
              <span className="browser-note" style={{ marginTop: 8 }}>
                Couldn't reach the GitHub API — falling back to {FIRMWARE_VERSION}.
              </span>
            )}
          </div>
          {device.image && !imageFailed && (
            <div className="flasher-device-image" aria-hidden="true">
              <img
                key={device.env}
                src={device.image}
                alt={device.name}
                loading="lazy"
                onError={() => setImageFailed(true)}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
