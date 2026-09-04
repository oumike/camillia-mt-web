import { useEffect, useMemo, useRef, useState } from 'react'
import 'esp-web-tools'
import { DEVICES } from '../devices.js'
import {
  FIRMWARE_VERSION,
  releaseCatalog,
  versionsForEnv,
  groupedVersionsForEnv,
  manifestDataUrl,
  firmwareUrl,
} from '../firmware.js'
import DebugReport from './DebugReport.jsx'

function serialSupported() {
  return typeof navigator !== 'undefined' && 'serial' in navigator
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function Flasher() {
  const [supported, setSupported] = useState(true)
  const [env, setEnv] = useState(DEVICES[0].env)
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
    releaseCatalog()
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
  }, [])

  const device = useMemo(
    () => DEVICES.find(d => d.env === env) ?? DEVICES[0],
    [env]
  )

  useEffect(() => { setImageFailed(false) }, [device.env])

  // Every tag with an asset for this device, newest first. Not what the picker
  // offers — see versions below — because the alpha half is capped at the
  // newest one.
  const catalogVersions = useMemo(() => {
    if (catalog === null) return []
    const fromCatalog = versionsForEnv(catalog, device.env)
    if (fromCatalog.length) return fromCatalog
    return [FIRMWARE_VERSION]
  }, [catalog, device.env])

  // Split for the picker. When the catalog is unavailable `catalogVersions` is
  // the hardcoded fallback tag, which has no release behind it to classify —
  // so treat it as stable rather than dropping it from the list entirely.
  const versionGroups = useMemo(() => {
    if (catalog === null || !catalog.length) return { stable: catalogVersions, alpha: [] }
    const grouped = groupedVersionsForEnv(catalog, device.env)
    if (!grouped.stable.length && !grouped.alpha.length) {
      return { stable: catalogVersions, alpha: [] }
    }
    return grouped
  }, [catalog, device.env, catalogVersions])

  // The tags that are actually selectable, derived from the groups so this and
  // the rendered <option> list cannot disagree. Superseded alphas are no longer
  // offered, and a stale one held in state must therefore not validate — it
  // would leave the control showing a value it has no option for.
  //
  // Ordering stays newest-first across both channels rather than alpha-then-
  // stable, because versions[0] is the default selection: grouping order would
  // pre-select a prerelease whenever one exists, and stable is the recommended
  // path.
  const versions = useMemo(() => {
    const offered = new Set([...versionGroups.alpha, ...versionGroups.stable])
    return catalogVersions.filter(tag => offered.has(tag))
  }, [catalogVersions, versionGroups])

  useEffect(() => {
    if (!versions.length) return
    if (!version || !versions.includes(version)) {
      setVersion(versions[0])
    }
  }, [versions, version])

  const manifestUrl = useMemo(
    () => version ? manifestDataUrl(device, version) : null,
    [device.env, version]
  )

  const selectedRelease = useMemo(() => {
    if (!Array.isArray(catalog) || !version) return null
    return catalog.find(rel => rel.tag === version) ?? null
  }, [catalog, version])

  const selectedNotes = (selectedRelease?.notes ?? '').trim()
  const selectedReleaseUrl = selectedRelease?.url
    || (version ? `https://github.com/oumike/camillia-mt/releases/tag/${encodeURIComponent(version)}` : '')

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
                  {DEVICES.map(d => (
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
                    {versionGroups.alpha.length > 0 && (
                      <optgroup label="── Alpha — prerelease, for testers ──">
                        {versionGroups.alpha.map(tag => (
                          <option key={tag} value={tag}>
                            {tag}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {versionGroups.stable.length > 0 && (
                      <optgroup label="── Stable — recommended ──">
                        {versionGroups.stable.map(tag => (
                          <option key={tag} value={tag}>
                            {tag}
                          </option>
                        ))}
                      </optgroup>
                    )}
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
                      href={firmwareUrl(device.env, version)}
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
                <button className="btn" disabled>Loading releases…</button>
              )}
              <DebugReport
                device={device}
                version={version}
                supported={supported}
              />
            </div>
            {versionStale && (
              <p className="browser-note">
                Couldn't reach the GitHub API release list — falling back to {FIRMWARE_VERSION}.
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
