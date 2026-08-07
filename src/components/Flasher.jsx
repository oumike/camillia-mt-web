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
    return () => { cancelled = true }
  }, [])

  const device = useMemo(
    () => DEVICES.find(d => d.env === env) ?? DEVICES[0],
    [env]
  )

  useEffect(() => { setImageFailed(false) }, [device.env])

  const manifestUrl = useMemo(
    () => version ? manifestDataUrl(device, version) : null,
    [device.env, version]
  )

  return (
    <section id="flash">
      <div className="container">
        <p className="eyebrow">Install</p>
        <h2>Flash from your browser</h2>
        <p className="measure">
          Plug the device in over USB, pick its build profile, and this page
          writes the latest firmware straight to it.
        </p>
        {!supported && (
          <div className="panel notice">
            <strong>Web Serial isn't available in this browser.</strong>{' '}
            Use a recent Chrome, Edge, or Opera on desktop. iOS Safari and
            Firefox don't expose Web Serial — on those, download the{' '}
            <span className="kbd">.bin</span> and use{' '}
            <span className="kbd">flash.sh</span> from the command line.
          </div>
        )}
        <div className="panel flasher">
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
            <div className="flasher-actions">
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
              <p className="browser-note">
                Couldn't reach the GitHub API — falling back to {FIRMWARE_VERSION}.
              </p>
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
