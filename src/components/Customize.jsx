import { useEffect, useRef, useState } from 'react'
import {
  RADIO_PRESETS,
  CustomizeError,
  applyCustomization,
  customizationCount,
  loadCustomization,
  presetLabel,
  saveCustomization,
} from '../customize.js'

const FOCUSABLE = 'a[href], button:not([disabled]), select:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'

function formatBw(bw) {
  return `${bw} kHz`
}

// Pre-configuration for a Camillia-MT install. Choices are kept in the browser
// and sent to the device over USB serial (see customize.js). `flashCount` goes
// up each time a flash finishes, which offers to apply them straight away.
export default function Customize({ supported, flashCount = 0 }) {
  const [open, setOpen] = useState(false)
  const [afterFlash, setAfterFlash] = useState(false)
  const [settings, setSettings] = useState(loadCustomization)
  const [draft, setDraft] = useState(settings)
  const [phase, setPhase] = useState('idle')
  const [status, setStatus] = useState('')

  const panelRef = useRef(null)
  const closeRef = useRef(null)
  const returnRef = useRef(null)
  const mountedRef = useRef(true)
  const lastFlashRef = useRef(flashCount)

  const secure = typeof window === 'undefined' || window.isSecureContext
  const available = supported && secure
  const busy = phase === 'applying'
  const busyRef = useRef(false)
  busyRef.current = busy
  const count = customizationCount(settings)
  const draftCount = customizationCount(draft)
  const dirty = draft.preset !== settings.preset

  function openModal(event, fromFlash = false) {
    if (!panelRef.current?.contains(document.activeElement)) {
      returnRef.current = event?.currentTarget ?? document.activeElement
    }
    setDraft(settings)
    setAfterFlash(fromFlash)
    setPhase('idle')
    setStatus(fromFlash
      ? 'Firmware installed. Apply your customizations once the device has rebooted.'
      : '')
    setOpen(true)
  }

  function requestClose() {
    if (busyRef.current) return
    setOpen(false)
  }

  function commitDraft() {
    setSettings(draft)
    saveCustomization(draft)
    return draft
  }

  function save() {
    commitDraft()
    setOpen(false)
  }

  async function apply() {
    const chosen = commitDraft()
    if (!customizationCount(chosen)) return
    if (!available) {
      setPhase('error')
      setStatus(supported
        ? 'Web Serial requires HTTPS or localhost.'
        : 'Web Serial is not available in this browser.')
      return
    }

    setPhase('applying')
    setStatus('Select the connected Camillia device in the browser prompt.')
    let port = null
    try {
      port = await navigator.serial.requestPort()
      await port.open({ baudRate: 115200 })
      const result = await applyCustomization(port, chosen, text => {
        if (mountedRef.current) setStatus(text)
      })
      if (!mountedRef.current) return
      setPhase('ready')
      setStatus(result.outcome === 'setup'
        ? 'Saved. Finish setup on the device; your choices take effect when it completes.'
        : result.outcome === 'rebooting'
          ? 'Saved. The device is rebooting with your choices.'
          : 'The device already had these settings.')
    } catch (error) {
      if (!mountedRef.current) return
      setPhase('error')
      setStatus(error?.name === 'NotFoundError'
        ? 'No device was selected.'
        : error?.name === 'InvalidStateError' || /already open|failed to open/i.test(error?.message ?? '')
          ? 'The serial port is busy. Close the flash dialog and any serial monitors, then retry.'
          : error instanceof CustomizeError
            ? error.message
            : `Could not apply: ${error?.message || 'Unknown serial error'}`)
    } finally {
      if (port) {
        try { await port.close() } catch {}
      }
    }
  }

  useEffect(() => {
    if (flashCount === lastFlashRef.current) return
    lastFlashRef.current = flashCount
    if (customizationCount(settings)) openModal(null, true)
  }, [flashCount])

  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const onKeyDown = event => {
      if (event.key === 'Escape') {
        event.preventDefault()
        requestClose()
        return
      }
      if (event.key !== 'Tab') return
      const items = panelRef.current?.querySelectorAll(FOCUSABLE)
      if (!items?.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      returnRef.current?.focus?.()
    }
  }, [open])

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const selected = RADIO_PRESETS.find(p => p.name === draft.preset)

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={event => openModal(event)}
        title="Pre-configure settings to send to the device after flashing"
      >
        Customize{count ? ` (${count})` : ''}
      </button>

      {open && (
        <div
          className="debug-report-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="customize-title"
          onClick={requestClose}
        >
          <div
            className="debug-report-panel customize-panel"
            ref={panelRef}
            onClick={event => event.stopPropagation()}
          >
            <div className="debug-report-head">
              <div>
                <p className="eyebrow">Pre-configure</p>
                <h3 id="customize-title">Customize</h3>
              </div>
              <button
                type="button"
                ref={closeRef}
                className="debug-report-close"
                onClick={requestClose}
                disabled={busy}
              >
                Close
              </button>
            </div>

            <p className="debug-report-privacy">
              Choose settings to send to the device over USB after flashing. On a
              fresh install they are held until you finish setup on the device;
              on an existing install the device saves them and reboots. Your
              choices are remembered in this browser.
            </p>

            <label className="flasher-select customize-field">
              <span>Radio preset</span>
              <select
                value={draft.preset}
                onChange={event => setDraft(d => ({ ...d, preset: event.target.value }))}
                disabled={busy}
              >
                <option value="">Don't change (device default)</option>
                {RADIO_PRESETS.map(p => (
                  <option key={p.name} value={p.name}>
                    {p.label}{p.tiny ? ' (TCXO radios only)' : ''}
                  </option>
                ))}
              </select>
            </label>
            <p className="browser-note customize-note">
              {selected
                ? <>{formatBw(selected.bw)}, SF{selected.sf}, CR 4/{selected.cr}. Every node on your mesh must use the same preset.{selected.tiny ? ' Only radios with a TCXO can run this; others refuse it.' : ''}</>
                : 'Keeps the firmware default: Long Fast, or Long Turbo when the region is set to US during setup.'}
            </p>

            {status && (
              <div className={`debug-report-status debug-report-status-${phase === 'applying' ? 'capturing' : phase}`} role="status">
                <span className="debug-report-status-dot" aria-hidden="true" />
                <span>{status}</span>
              </div>
            )}

            <div className="debug-report-actions">
              {!afterFlash && (
                <button
                  type="button"
                  className="flasher-row-btn"
                  onClick={save}
                  disabled={busy || !dirty}
                >
                  Save
                </button>
              )}
              <button
                type="button"
                className="btn"
                onClick={apply}
                disabled={busy || !draftCount || !available}
                title={!available ? 'Web Serial requires Chrome, Edge, or Opera on desktop over HTTPS' : undefined}
              >
                {busy ? 'Applying…' : 'Apply to device'}
              </button>
            </div>
            {!draftCount && (
              <p className="browser-note">Pick at least one setting to apply.</p>
            )}
            {draftCount > 0 && !afterFlash && (
              <p className="browser-note">
                Saved choices are offered after each flash. Apply to device sends them
                to a device that is already running Camillia-MT ({presetLabel(draft.preset)}).
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
