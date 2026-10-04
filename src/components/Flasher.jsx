import { useEffect, useMemo, useRef, useState } from 'react'
import 'esp-web-tools'
import {
  releaseCatalog,
  versionsForEnv,
  manifestDataUrl,
  firmwareUrl,
  releaseUrl,
} from '../firmware.js'
import DebugReport from './DebugReport.jsx'

function serialSupported() {
  return typeof navigator !== 'undefined' && 'serial' in navigator
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

// `product` is MT_FIRMWARE or CS_FIRMWARE from firmware.js; `devices` is that
// firmware's board list. Debug & report speaks camillia-mt's serial health
// commands, so it is only offered where the firmware answers them.
export default function Flasher({ product, devices, debugReport = false }) {
  const [supported, setSupported] = useState(true)
  const [env, setEnv] = useState(devices[0].env)
  const [catalog, setCatalog] = useState(null)
  const [version, setVersion] = useState(null)
  const [showNotes, setShowNotes] = useState(false)
  const [versionStale, setVersionStale] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)
  const notesPanelRef = useRef(null)
  const notesCloseRef = useRef(null)
  const notesReturnRef = useRef(null)

  useEffect(() => setSupported(serialSupported()), [])

  useEffect(() => {
    let cancelled = false
    releaseCatalog(product.repo)
      .then(items => {
        if (!cancelled) {
          setCatalog(items)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCatalog([])
          setVersionStale(true)
        }
      })
    return () => { cancelled = true }
  }, [product.repo])

  const device = useMemo(
    () => devices.find(d => d.env === env) ?? devices[0],
    [devices, env]
  )

  useEffect(() => { setImageFailed(false) }, [device.env])

  // Every selectable tag for this device, newest first. versionsForEnv() is
  // stable-only, so prereleases never reach the picker.
  //
  // When the GitHub API is unreachable the catalog comes back empty and the
  // product's hardcoded fallbackVersion stands in: it has no release behind it
  // to check, but dropping it would leave the control with nothing at all. A
  // product without one (the chat server) shows that there is nothing to flash.
  const versions = useMemo(() => {
    if (catalog === null) return []
    const fromCatalog = versionsForEnv(product, catalog, device.env)
    if (fromCatalog.length) return fromCatalog
    return product.fallbackVersion ? [product.fallbackVersion] : []
  }, [product, catalog, device.env])

  useEffect(() => {
    if (!versions.length) {
      setVersion(null)
      return
    }
    if (!version || !versions.includes(version)) {
      setVersion(versions[0])
    }
  }, [versions, version])

  const manifestUrl = useMemo(
    () => version ? manifestDataUrl(product, device, version) : null,
    [product, device.env, version]
  )

  const selectedRelease = useMemo(() => {
    if (!Array.isArray(catalog) || !version) return null
    return catalog.find(rel => rel.tag === version) ?? null
  }, [catalog, version])

  const selectedNotes = (selectedRelease?.notes ?? '').trim()
  const selectedReleaseUrl = selectedRelease?.url
    || (version ? releaseUrl(product, version) : '')

  function openNotes() {
    notesReturnRef.current = document.activeElement
    setShowNotes(true)
  }

  function closeNotes() {
    setShowNotes(false)
  }

  useEffect(() => {
    if (!showNotes) return undefined

    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    notesCloseRef.current?.focus()

    const onKeyDown = e => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeNotes()
        return
      }
      if (e.key !== 'Tab') return
      const items = notesPanelRef.current?.querySelectorAll(FOCUSABLE)
      if (!items?.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflow
      notesReturnRef.current?.focus?.()
    }
  }, [showNotes])

  return (
    <section id="flash">
      <div className="container">
        <p className="eyebrow">Install</p>
        <h2>Flash from your browser</h2>
        <p className="measure">
          Plug the device in over USB, pick its build profile and firmware
          version, and this page writes it straight to the device.
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
            <div className="flasher-selects">
              <label className="flasher-select">
                <span>Device</span>
                <select value={env} onChange={e => setEnv(e.target.value)}>
                  {devices.map(d => (
                    <option key={d.env} value={d.env}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flasher-select">
                <span>Version</span>
                <div className="flasher-version-row">
                  <select
                    value={version ?? ''}
                    onChange={e => setVersion(e.target.value)}
                    disabled={!versions.length}
                  >
                    {versions.map(tag => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="flasher-row-btn"
                    onClick={() => (showNotes ? closeNotes() : openNotes())}
                    disabled={!version}
                  >
                    {showNotes ? 'Hide notes' : 'Release notes'}
                  </button>
                  {version ? (
                    <a
                      className="flasher-row-btn"
                      href={firmwareUrl(product, device.env, version)}
                      download
                    >
                      Download .bin
                    </a>
                  ) : (
                    <button type="button" className="flasher-row-btn" disabled>
                      Download .bin
                    </button>
                  )}
                </div>
              </label>
            </div>
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
                </>
              ) : (
                <button className="btn" disabled>
                  {catalog === null ? 'Loading releases…' : 'No release yet'}
                </button>
              )}
              {debugReport && (
                <DebugReport
                  device={device}
                  version={version}
                  supported={supported}
                />
              )}
            </div>
            {versionStale ? (
              <p className="browser-note">
                Couldn't reach the GitHub API release list
                {product.fallbackVersion ? <> — falling back to {product.fallbackVersion}.</> : '.'}
              </p>
            ) : catalog !== null && !versions.length && (
              <p className="browser-note">
                No {product.name} release has been published for this board
                yet. Watch the{' '}
                <a href={`https://github.com/${product.repo}/releases`} target="_blank" rel="noreferrer">releases page</a>.
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
        {showNotes && version && (
          <div
            className="flasher-notes-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Release notes ${version}`}
            onClick={closeNotes}
          >
            <div
              className="flasher-notes-modal-panel"
              ref={notesPanelRef}
              onClick={e => e.stopPropagation()}
            >
              <div className="flasher-notes-modal-head">
                <strong>{version}</strong>
                <div className="flasher-notes-modal-actions">
                  {selectedReleaseUrl && (
                    <a href={selectedReleaseUrl} target="_blank" rel="noreferrer">Open on GitHub</a>
                  )}
                  <button
                    type="button"
                    ref={notesCloseRef}
                    className="flasher-notes-modal-close"
                    onClick={closeNotes}
                  >
                    Close
                  </button>
                </div>
              </div>
              {selectedNotes ? (
                <pre className="flasher-notes-modal-body">{selectedNotes}</pre>
              ) : (
                <p className="browser-note">
                  No embedded release-note body for this tag. Use Open on GitHub.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
