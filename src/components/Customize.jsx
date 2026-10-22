import { useEffect, useRef, useState } from 'react'
import {
  CHANNEL_NAME_MAX,
  MAX_CHANNELS,
  PROFILES,
  RADIO_PRESETS,
  SPLASH_CARD_BG,
  CustomizeError,
  applyCustomization,
  customizationCount,
  customizationErrors,
  loadCustomization,
  newChannel,
  prepareLogoSource,
  randomPsk,
  saveCustomization,
} from '../customize.js'

const FOCUSABLE = 'a[href], button:not([disabled]), select:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'

function formatBw(bw) {
  return `${bw} kHz`
}

function pskMode(psk) {
  return psk === 'default' || psk === 'none' ? psk : 'custom'
}

function ChannelRow({ channel, index, error, disabled, onChange, onRemove }) {
  const mode = pskMode(channel.psk)
  const set = patch => onChange({ ...channel, ...patch })
  return (
    <li className="customize-channel">
      <div className="customize-channel-head">
        <span className="customize-channel-slot">{index === 0 ? 'Primary' : `Slot ${index}`}</span>
        {index > 0 && (
          <button type="button" className="customize-link" onClick={onRemove} disabled={disabled}>
            Remove
          </button>
        )}
      </div>
      <div className="customize-channel-fields">
        <label className="customize-input">
          <span>Name</span>
          <input
            type="text"
            value={channel.name}
            maxLength={CHANNEL_NAME_MAX}
            placeholder={index === 0 ? 'Preset name' : 'Required'}
            onChange={event => set({ name: event.target.value })}
            disabled={disabled}
            aria-invalid={Boolean(error) || undefined}
          />
        </label>
        <label className="customize-input">
          <span>Key</span>
          <select
            value={mode}
            onChange={event => {
              const next = event.target.value
              set({ psk: next === 'custom' ? randomPsk() : next })
            }}
            disabled={disabled}
          >
            <option value="default">Default (AQ==)</option>
            <option value="none">No encryption</option>
            <option value="custom">Custom key</option>
          </select>
        </label>
        {mode === 'custom' && (
          <label className="customize-input customize-input-wide">
            <span>Key (base64)</span>
            <div className="customize-key">
              <input
                type="text"
                value={channel.psk}
                spellCheck={false}
                onChange={event => set({ psk: event.target.value })}
                disabled={disabled}
                aria-invalid={Boolean(error) || undefined}
              />
              <button type="button" className="customize-link" onClick={() => set({ psk: randomPsk() })} disabled={disabled}>
                Random
              </button>
            </div>
          </label>
        )}
      </div>
      <div className="customize-channel-flags">
        <label><input type="checkbox" checked={channel.pos} onChange={event => set({ pos: event.target.checked })} disabled={disabled} /> Share position</label>
        <label><input type="checkbox" checked={channel.up} onChange={event => set({ up: event.target.checked })} disabled={disabled} /> MQTT uplink</label>
        <label><input type="checkbox" checked={channel.down} onChange={event => set({ down: event.target.checked })} disabled={disabled} /> MQTT downlink</label>
      </div>
      {error && <p className="customize-error">{error}</p>}
    </li>
  )
}

// Flash and Customize: the user picks settings, Continue saves them in the
// browser and starts the installer through `onFlash` (Flasher's esp-web-tools
// button). `flashCount` goes up when that install finishes, which reopens the
// dialog to send the settings to the device over USB serial (see customize.js).
export default function Customize({ supported, canFlash = false, onFlash, flashCount = 0 }) {
  const [open, setOpen] = useState(false)
  const [afterFlash, setAfterFlash] = useState(false)
  const [settings, setSettings] = useState(loadCustomization)
  const [draft, setDraft] = useState(settings)
  const [phase, setPhase] = useState('idle')
  const [status, setStatus] = useState('')
  const [profileId, setProfileId] = useState('')
  const [logoError, setLogoError] = useState('')

  const panelRef = useRef(null)
  const closeRef = useRef(null)
  const returnRef = useRef(null)
  const mountedRef = useRef(true)
  const logoRequestRef = useRef(0)
  const lastFlashRef = useRef(flashCount)

  const secure = typeof window === 'undefined' || window.isSecureContext
  const available = supported && secure
  const busy = phase === 'applying'
  const busyRef = useRef(false)
  busyRef.current = busy
  const draftCount = customizationCount(draft)
  const errors = customizationErrors(draft)
  const invalid = errors.some(Boolean)
  const profile = PROFILES.find(p => p.id === profileId)

  function openModal(event, fromFlash = false) {
    if (!panelRef.current?.contains(document.activeElement)) {
      returnRef.current = event?.currentTarget ?? document.activeElement
    }
    setDraft(settings)
    setProfileId('')
    setLogoError('')
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
    if (!saveCustomization(draft)) {
      setLogoError('This browser could not remember the logo; it will be sent now but not offered next time.')
    }
    return draft
  }

  function chooseProfile(id) {
    setProfileId(id)
    const chosen = PROFILES.find(p => p.id === id)
    if (!chosen) return
    const request = ++logoRequestRef.current
    setDraft(d => ({
      ...d,
      preset: chosen.preset,
      channels: chosen.channels.map(c => ({ ...c })),
    }))
    if (!chosen.logo) return
    setLogoError('')
    prepareLogoSource(chosen.logo)
      .then(logo => {
        if (mountedRef.current && logoRequestRef.current === request) setDraft(d => ({ ...d, logo }))
      })
      .catch(() => {
        if (mountedRef.current && logoRequestRef.current === request) {
          setLogoError(`The ${chosen.label.split(' ')[0]} logo could not be loaded.`)
        }
      })
  }

  function setLogo(logo) {
    logoRequestRef.current += 1
    setDraft(d => ({ ...d, logo }))
  }

  function setChannels(update) {
    setProfileId('')
    setDraft(d => ({ ...d, channels: update(d.channels) }))
  }

  async function chooseLogo(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setLogoError('')
    const request = ++logoRequestRef.current
    try {
      const logo = await prepareLogoSource(file)
      if (mountedRef.current && logoRequestRef.current === request) setDraft(d => ({ ...d, logo }))
    } catch (error) {
      if (mountedRef.current) setLogoError(error?.message || 'That file could not be read as an image.')
    }
  }

  function continueToFlash() {
    if (invalid || !draftCount) return
    commitDraft()
    if (!onFlash?.()) {
      setPhase('error')
      setStatus('The installer could not be started. Pick a board and version first.')
      return
    }
    setOpen(false)
  }

  async function apply() {
    if (invalid) return
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
        disabled={!canFlash || !available}
        title={!available
          ? 'Web Serial requires Chrome, Edge, or Opera on desktop over HTTPS'
          : 'Choose settings, flash, then send them to the device'}
      >
        Flash and Customize
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
                <h3 id="customize-title">Flash and Customize</h3>
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
              <span>Start from</span>
              <select
                value={profileId}
                onChange={event => chooseProfile(event.target.value)}
                disabled={busy}
              >
                <option value="">My own settings</option>
                {PROFILES.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </label>
            {profile && (
              <p className="browser-note customize-note">
                Fills in the radio preset, channels and logo <a href={profile.url} target="_blank" rel="noreferrer">{profile.label.split(' ')[0]}</a> publishes. {profile.notes}
              </p>
            )}

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

            <fieldset className="customize-section">
              <legend>Boot logo</legend>
              <div className="customize-logo">
                <div className="customize-logo-preview" style={{ background: SPLASH_CARD_BG }}>
                  {draft.logo && draft.logo !== 'clear'
                    ? <img src={draft.logo} alt="Chosen boot logo" />
                    : <span>{draft.logo === 'clear' ? 'Camillia (default title)' : 'No change'}</span>}
                </div>
                <div className="customize-logo-actions">
                  <label className={`flasher-row-btn customize-file${busy ? ' is-disabled' : ''}`}>
                    Choose image…
                    <input type="file" accept="image/*" onChange={chooseLogo} disabled={busy} />
                  </label>
                  <button
                    type="button"
                    className="customize-link"
                    onClick={() => setLogo('clear')}
                    disabled={busy || draft.logo === 'clear'}
                  >
                    Restore default title
                  </button>
                  {draft.logo && (
                    <button
                      type="button"
                      className="customize-link"
                      onClick={() => setLogo('')}
                      disabled={busy}
                    >
                      Don't change
                    </button>
                  )}
                </div>
              </div>
              <p className="browser-note customize-note">
                Shown on the boot screen in place of the Camillia title. It is scaled to
                fit each device (about 300×60 on most) and drawn on the card colour, so a
                wide logo on a transparent background works best.
              </p>
              {logoError && <p className="customize-error">{logoError}</p>}
            </fieldset>

            <fieldset className="customize-section">
              <legend>Channels</legend>
              <label className="customize-check">
                <input
                  type="checkbox"
                  checked={Boolean(draft.channels)}
                  onChange={event => setChannels(() => (event.target.checked ? [newChannel(0)] : null))}
                  disabled={busy}
                />
                Replace the device's channels
              </label>
              {draft.channels ? (
                <>
                  <ol className="customize-channels">
                    {draft.channels.map((channel, index) => (
                      <ChannelRow
                        key={index}
                        channel={channel}
                        index={index}
                        error={errors[index]}
                        disabled={busy}
                        onChange={next => setChannels(list => list.map((c, i) => (i === index ? next : c)))}
                        onRemove={() => setChannels(list => list.filter((_, i) => i !== index))}
                      />
                    ))}
                  </ol>
                  <button
                    type="button"
                    className="flasher-row-btn"
                    onClick={() => setChannels(list => [...list, newChannel(list.length)])}
                    disabled={busy || draft.channels.length >= MAX_CHANNELS}
                  >
                    Add channel
                  </button>
                  <p className="browser-note customize-note">
                    Every channel on the device is replaced by this list. Most devices hold
                    {' '}{MAX_CHANNELS} channels; the Cardputer holds 8. MQTT settings only
                    matter once MQTT is set up on the device.
                  </p>
                </>
              ) : (
                <p className="browser-note customize-note">Keeps the channels the device already has.</p>
              )}
            </fieldset>

            {status && (
              <div className={`debug-report-status debug-report-status-${phase === 'applying' ? 'capturing' : phase}`} role="status">
                <span className="debug-report-status-dot" aria-hidden="true" />
                <span>{status}</span>
              </div>
            )}

            <div className="debug-report-actions">
              <button
                type="button"
                className="flasher-row-btn"
                onClick={requestClose}
                disabled={busy}
              >
                {afterFlash ? 'Skip' : 'Cancel'}
              </button>
              {afterFlash ? (
                <button
                  type="button"
                  className="btn"
                  onClick={apply}
                  disabled={busy || !draftCount || !available || invalid}
                  title={!available ? 'Web Serial requires Chrome, Edge, or Opera on desktop over HTTPS' : undefined}
                >
                  {busy ? 'Applying…' : 'Apply to device'}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn"
                  onClick={continueToFlash}
                  disabled={!draftCount || !available || invalid}
                >
                  Continue to flash
                </button>
              )}
            </div>
            {!draftCount && (
              <p className="browser-note">Pick at least one setting.</p>
            )}
            {invalid && (
              <p className="browser-note">Fix the highlighted channels first.</p>
            )}
            {draftCount > 0 && !afterFlash && (
              <p className="browser-note">
                Continue opens the installer. When the flash finishes, this dialog
                comes back to send your choices to the device.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
