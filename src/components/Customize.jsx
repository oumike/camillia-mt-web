import { useEffect, useRef, useState } from 'react'
import {
  CHANNEL_NAME_MAX,
  LONG_NAME_MAX,
  PRODUCTS,
  PROFILES,
  PROFILE_AREAS,
  profileFills,
  profileName,
  RADIO_PRESETS,
  REGIONS,
  ROLES,
  SHORT_NAME_MAX,
  SLOT_MAX,
  SPLASH_CARD_BG,
  CustomizeError,
  applyCustomization,
  customizationCount,
  customizationErrors,
  customizationInvalid,
  loadCustomization,
  mqttSettings,
  newChannel,
  newSetup,
  prepareLogoSource,
  randomPsk,
  saveCustomization,
  setupErrors,
  slotError,
} from '../customize.js'

const FOCUSABLE = 'a[href], button:not([disabled]), select:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'

function formatBw(bw) {
  return `${bw} kHz`
}

function pskMode(psk) {
  return psk === 'default' || psk === 'none' ? psk : 'custom'
}

function ChannelRow({ channel, index, error, disabled, flags = true, onChange, onRemove }) {
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
      {flags && <div className="customize-channel-flags">
        <label><input type="checkbox" checked={channel.pos} onChange={event => set({ pos: event.target.checked })} disabled={disabled} /> Share position</label>
        <label><input type="checkbox" checked={channel.up} onChange={event => set({ up: event.target.checked })} disabled={disabled} /> MQTT uplink</label>
        <label><input type="checkbox" checked={channel.down} onChange={event => set({ down: event.target.checked })} disabled={disabled} /> MQTT downlink</label>
      </div>}
      {error && <p className="customize-error">{error}</p>}
    </li>
  )
}

function SetupFields({ setup, errors, role: showRole = true, onChange }) {
  const set = patch => onChange({ ...setup, ...patch })
  const role = ROLES.find(r => r.name === setup.role)
  return (
    <>
      <div className="customize-channel-fields">
        <label className="customize-input">
          <span>Long name</span>
          <input
            type="text"
            value={setup.longName}
            maxLength={LONG_NAME_MAX}
            placeholder="From node ID: Camillia 1a2b"
            onChange={event => set({ longName: event.target.value })}
            aria-invalid={Boolean(errors.longName) || undefined}
          />
        </label>
        <label className="customize-input">
          <span>Short name</span>
          <input
            type="text"
            value={setup.shortName}
            maxLength={SHORT_NAME_MAX}
            placeholder="From node ID: 1a2b"
            onChange={event => set({ shortName: event.target.value })}
            aria-invalid={Boolean(errors.shortName) || undefined}
          />
        </label>
      </div>
      <div className="customize-channel-fields">
        <label className="customize-input">
          <span>Region</span>
          <select value={setup.region} onChange={event => set({ region: event.target.value })}>
            {REGIONS.map(r => <option key={r.code} value={r.code}>{r.label}</option>)}
          </select>
        </label>
        {showRole && <label className="customize-input">
          <span>Role</span>
          <select value={setup.role} onChange={event => set({ role: event.target.value })}>
            {ROLES.map(r => <option key={r.name} value={r.name}>{r.label}</option>)}
          </select>
        </label>}
      </div>
      {showRole && role && <p className="browser-note customize-note">{role.note}</p>}
      <div className="customize-channel-fields">
        <label className="customize-input">
          <span>Wi-Fi network (optional)</span>
          <input
            type="text"
            value={setup.wifiSsid}
            autoComplete="off"
            spellCheck={false}
            onChange={event => set({ wifiSsid: event.target.value })}
            aria-invalid={Boolean(errors.wifiSsid) || undefined}
          />
        </label>
        <label className="customize-input">
          <span>Wi-Fi password</span>
          <input
            type="password"
            value={setup.wifiPass}
            autoComplete="new-password"
            disabled={!setup.wifiSsid}
            placeholder={setup.wifiSsid ? 'Empty for an open network' : ''}
            onChange={event => set({ wifiPass: event.target.value })}
            aria-invalid={Boolean(errors.wifiPass) || undefined}
          />
        </label>
      </div>
      {Object.values(errors).map(error => <p key={error} className="customize-error">{error}</p>)}
      <p className="browser-note customize-note">
        Blank names make each device name itself from its node ID, so one set of
        choices can flash many devices. The Wi-Fi password is not remembered in
        this browser; enter it again on each visit.
      </p>
    </>
  )
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const SERIAL_OPTIONS = { baudRate: 115200 }
// esp-web-tools closes its port as its dialog goes, without waiting; opening
// the same port is retried until that has finished.
const REOPEN_WINDOW_MS = 5_000

// Opens the installer's port again. If the device came back from its reboot as
// a new port, an already-granted port of the same USB device stands in. Only a
// click (Retry) may fall back to the port prompt.
async function openDevicePort(preferred, { waitMs = 0, allowPrompt = false } = {}) {
  const candidates = preferred ? [preferred] : []
  if (preferred) {
    const want = preferred.getInfo?.() ?? {}
    try {
      for (const port of await navigator.serial.getPorts()) {
        const info = port.getInfo?.() ?? {}
        if (port !== preferred && want.usbVendorId != null
          && info.usbVendorId === want.usbVendorId && info.usbProductId === want.usbProductId) {
          candidates.push(port)
        }
      }
    } catch {}
  }
  const deadline = Date.now() + waitMs
  while (candidates.length) {
    for (const port of candidates) {
      try {
        await port.open(SERIAL_OPTIONS)
        return port
      } catch {}
    }
    if (Date.now() >= deadline) break
    await delay(300)
  }
  if (!allowPrompt) {
    throw new CustomizeError('The device\'s serial port could not be opened again. Click Retry and pick its port.')
  }
  const port = await navigator.serial.requestPort()
  await port.open(SERIAL_OPTIONS)
  return port
}

function applyErrorText(error) {
  return error?.name === 'NotFoundError'
    ? 'No device was selected.'
    : error?.name === 'InvalidStateError' || /already open|failed to open/i.test(error?.message ?? '')
      ? 'The serial port is busy. Close any serial monitors, then retry.'
      : error instanceof CustomizeError
        ? error.message
        : `Could not apply: ${error?.message || 'Unknown serial error'}`
}

// Flash and customize: the user picks settings, Continue saves them in the
// browser and starts the installer through `onFlash` (Flasher's esp-web-tools
// button). When that install finishes Flasher passes `flashed` ({ id, port }),
// and the settings are sent to the device over that same port with no further
// prompt (see customize.js); progress shows inline under the buttons.
export default function Customize({ supported, canFlash = false, onFlash, flashed = null, product = PRODUCTS.mt }) {
  const [open, setOpen] = useState(false)
  const [settings, setSettings] = useState(() => loadCustomization(product))
  const [draft, setDraft] = useState(settings)
  const [phase, setPhase] = useState('idle')
  const [status, setStatus] = useState('')
  const [profileId, setProfileId] = useState('')
  const [logoError, setLogoError] = useState('')
  const [allFlags, setAllFlags] = useState({ pos: false, up: false, down: false })

  const panelRef = useRef(null)
  const closeRef = useRef(null)
  const returnRef = useRef(null)
  const mountedRef = useRef(true)
  const logoRequestRef = useRef(0)
  const lastFlashRef = useRef(flashed?.id ?? 0)
  const flashPortRef = useRef(null)
  const applyingRef = useRef(false)

  const secure = typeof window === 'undefined' || window.isSecureContext
  const available = supported && secure
  const applying = phase === 'applying'
  const draftCount = customizationCount(draft)
  const errors = customizationErrors(draft)
  const draftSetupErrors = setupErrors(draft.setup)
  const invalid = customizationInvalid(draft)
  const profile = PROFILES.find(p => p.id === profileId)

  function openModal(event) {
    if (!panelRef.current?.contains(document.activeElement)) {
      returnRef.current = event?.currentTarget ?? document.activeElement
    }
    setDraft(settings)
    setProfileId('')
    setLogoError('')
    setOpen(true)
  }

  function requestClose() {
    setOpen(false)
  }

  function commitDraft() {
    setSettings(draft)
    if (!saveCustomization(draft, product)) {
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
      setup: d.setup && chosen.region ? { ...d.setup, region: chosen.region } : d.setup,
      preset: chosen.preset,
      slot: chosen.slot ?? 0,
      channels: chosen.channels.map(c => ({ ...c })),
      // Nor another community's broker.
      mqtt: mqttSettings(chosen.mqtt),
      // Another community's logo must not carry over.
      logo: chosen.logo ? d.logo : '',
    }))
    if (!chosen.logo) return
    setLogoError('')
    prepareLogoSource(chosen.logo)
      .then(logo => {
        if (mountedRef.current && logoRequestRef.current === request) setDraft(d => ({ ...d, logo }))
      })
      .catch(() => {
        if (mountedRef.current && logoRequestRef.current === request) {
          setLogoError(`The ${profileName(chosen)} logo could not be loaded.`)
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
      setLogoError('The installer could not be started. Pick a board and version first.')
      return
    }
    setPhase('idle')
    setStatus('')
    setOpen(false)
  }

  // `retry` runs inside a click, so it may fall back to the port prompt.
  async function apply({ retry = false } = {}) {
    if (applyingRef.current) return
    const chosen = settings
    if (!customizationCount(chosen) || customizationInvalid(chosen)) return
    applyingRef.current = true
    setPhase('applying')
    setStatus('Firmware installed. Connecting to the device to apply your settings...')
    let port = null
    try {
      port = await openDevicePort(flashPortRef.current, {
        waitMs: retry ? 0 : REOPEN_WINDOW_MS,
        allowPrompt: retry,
      })
      flashPortRef.current = port
      const result = await applyCustomization(port, chosen, text => {
        if (mountedRef.current) setStatus(text)
      }, product)
      if (!mountedRef.current) return
      setPhase('ready')
      setStatus(result.outcome === 'setup-done'
        ? 'Customization saved and setup finished. The device is rebooting, ready to use.'
        : result.outcome === 'setup'
        ? 'Customization saved. Finish setup on the device; your choices take effect when it completes.'
        : result.outcome === 'rebooting'
          ? product.id === 'cs'
            ? 'Customization saved. The server restarts with your choices: join its camillia-cs access point, or find it on your Wi-Fi.'
            : 'Customization saved. The device is rebooting with your choices.'
          : 'The device already had these settings.')
    } catch (error) {
      if (!mountedRef.current) return
      setPhase('error')
      setStatus(applyErrorText(error))
    } finally {
      applyingRef.current = false
      if (port) {
        try { await port.close() } catch {}
      }
    }
  }

  useEffect(() => {
    const id = flashed?.id ?? 0
    if (id === lastFlashRef.current) return
    lastFlashRef.current = id
    flashPortRef.current = flashed?.port ?? null
    if (customizationCount(settings)) apply()
  }, [flashed])

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
        Flash and customize
      </button>

      {status && (
        <div
          className={`debug-report-status debug-report-status-${applying ? 'capturing' : phase} customize-inline-status`}
          role="status"
        >
          <span className="debug-report-status-dot" aria-hidden="true" />
          <span>{status}</span>
          {!applying && (
            <span className="customize-inline-actions">
              {phase === 'error' && (
                <button type="button" className="flasher-row-btn" onClick={() => apply({ retry: true })}>
                  Retry
                </button>
              )}
              <button
                type="button"
                className="customize-link"
                onClick={() => { setPhase('idle'); setStatus('') }}
              >
                Dismiss
              </button>
            </span>
          )}
        </div>
      )}
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
                <h3 id="customize-title">Flash and customize</h3>
              </div>
              <button
                type="button"
                ref={closeRef}
                className="debug-report-close"
                onClick={requestClose}
              >
                Close
              </button>
            </div>

            <p className="debug-report-privacy">
              Choose settings to send to the device over USB after flashing. With
              Device setup filled in, a fresh install skips on-device setup;
              otherwise your choices are held until you finish setup on the
              device. An existing install saves them and reboots. Your choices
              are remembered in this browser.
            </p>

            <label className="flasher-select customize-field">
              <span>Start from</span>
              <select
                value={profileId}
                onChange={event => chooseProfile(event.target.value)}
              >
                <option value="">My own settings</option>
                {PROFILE_AREAS.map(area => (
                  <optgroup key={area} label={area}>
                    {PROFILES.filter(p => p.area === area).map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            {profile && (
              <p className="browser-note customize-note">
                Fills in the {profileFills(profile)} published for{' '}
                {profile.url
                  ? <a href={profile.url} target="_blank" rel="noreferrer">{profileName(profile)}</a>
                  : profileName(profile)}
                . {profile.notes}
              </p>
            )}

            <fieldset className="customize-section">
              <legend>Device setup</legend>
              <label className="customize-check">
                <input
                  type="checkbox"
                  checked={Boolean(draft.setup)}
                  onChange={event => setDraft(d => ({
                    ...d,
                    setup: event.target.checked ? { ...newSetup(), region: profile?.region ?? 'US' } : null,
                  }))}
                />
                {product.setupLabel}
              </label>
              {draft.setup ? (
                <SetupFields
                  setup={draft.setup}
                  errors={draftSetupErrors}
                  role={product.role}
                  onChange={setup => setDraft(d => ({ ...d, setup }))}
                />
              ) : (
                <p className="browser-note customize-note">{product.setupOffNote}</p>
              )}
            </fieldset>

            <label className="flasher-select customize-field">
              <span>Radio preset</span>
              <select
                value={draft.preset}
                onChange={event => setDraft(d => ({ ...d, preset: event.target.value }))}
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
            {selected && (
              <>
                <label className="customize-input customize-field">
                  <span>Frequency slot</span>
                  <input
                    type="number"
                    min="0"
                    max={SLOT_MAX}
                    step="1"
                    inputMode="numeric"
                    placeholder="Preset's own"
                    value={draft.slot || ''}
                    aria-invalid={slotError(draft.slot) ? true : undefined}
                    onChange={event => {
                      const text = event.target.value.trim()
                      setDraft(d => ({ ...d, slot: text === '' ? 0 : Number(text) }))
                    }}
                  />
                </label>
                <p className={slotError(draft.slot) ? 'customize-error' : 'browser-note customize-note'}>
                  {slotError(draft.slot)
                    || (draft.slot
                      ? `Pins the preset to slot ${draft.slot}, numbered as in the Meshtastic apps. The device shows it as custom modem settings.`
                      : 'Blank uses the slot the preset picks for itself, as most meshes do.')}
                </p>
              </>
            )}

            <fieldset className="customize-section">
              <legend>Boot logo</legend>
              <div className="customize-logo">
                <div className="customize-logo-preview" style={{ background: SPLASH_CARD_BG }}>
                  {draft.logo && draft.logo !== 'clear'
                    ? <img src={draft.logo} alt="Chosen boot logo" />
                    : <span>{draft.logo === 'clear' ? 'Camillia flower (default)' : 'No change'}</span>}
                </div>
                <div className="customize-logo-actions">
                  <label className="flasher-row-btn customize-file">
                    Choose image…
                    <input type="file" accept="image/*" onChange={chooseLogo} />
                  </label>
                  <button
                    type="button"
                    className="customize-link"
                    onClick={() => setLogo('clear')}
                    disabled={draft.logo === 'clear'}
                  >
                    Restore default flower
                  </button>
                  {draft.logo && (
                    <button
                      type="button"
                      className="customize-link"
                      onClick={() => setLogo('')}
                    >
                      Don't change
                    </button>
                  )}
                </div>
              </div>
              <p className="browser-note customize-note">
                Shown on the boot screen in place of the Camillia flower. It is scaled to
                fit each device (about 280×90 on most) and drawn on the card colour, so a
                logo on a transparent background works best.
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
                />
                Replace the device's channels
              </label>
              {draft.channels ? (
                <>
                  {product.channelFlags && <div className="customize-channel customize-channel-all">
                    <span className="customize-channel-slot">All channels</span>
                    <div className="customize-channel-flags">
                      <label><input type="checkbox" checked={allFlags.pos} onChange={event => setAllFlags(f => ({ ...f, pos: event.target.checked }))} /> Share position</label>
                      <label><input type="checkbox" checked={allFlags.up} onChange={event => setAllFlags(f => ({ ...f, up: event.target.checked }))} /> MQTT uplink</label>
                      <label><input type="checkbox" checked={allFlags.down} onChange={event => setAllFlags(f => ({ ...f, down: event.target.checked }))} /> MQTT downlink</label>
                    </div>
                    <button
                      type="button"
                      className="flasher-row-btn"
                      onClick={() => setChannels(list => list.map(c => ({ ...c, ...allFlags })))}
                    >
                      Apply to all channels
                    </button>
                  </div>}
                  <ol className="customize-channels">
                    {draft.channels.map((channel, index) => (
                      <ChannelRow
                        key={index}
                        channel={channel}
                        index={index}
                        error={errors[index]}
                        flags={product.channelFlags}
                        onChange={next => setChannels(list => list.map((c, i) => (i === index ? next : c)))}
                        onRemove={() => setChannels(list => list.filter((_, i) => i !== index))}
                      />
                    ))}
                  </ol>
                  <button
                    type="button"
                    className="flasher-row-btn"
                    onClick={() => setChannels(list => [...list, newChannel(list.length)])}
                    disabled={draft.channels.length >= product.maxChannels}
                  >
                    Add channel
                  </button>
                  <p className="browser-note customize-note">
                    Every channel on the device is replaced by this list. {product.channelNote}
                  </p>
                </>
              ) : (
                <p className="browser-note customize-note">Keeps the channels the device already has.</p>
              )}
            </fieldset>

            {(draft.mqtt || profile?.mqtt) && (
              <fieldset className="customize-section">
                <legend>MQTT</legend>
                <label className="customize-check">
                  <input
                    type="checkbox"
                    checked={Boolean(draft.mqtt)}
                    onChange={event => setDraft(d => ({
                      ...d,
                      mqtt: event.target.checked ? mqttSettings(profile?.mqtt ?? d.mqtt) : null,
                    }))}
                  />
                  Set up the community's MQTT broker and turn MQTT on
                </label>
                <p className="browser-note customize-note">
                  {draft.mqtt
                    ? <>Broker <code>{draft.mqtt.host}:{draft.mqtt.port}</code>, root topic{' '}
                        <code>{draft.mqtt.root}</code>
                        {draft.mqtt.user ? <>, login <code>{draft.mqtt.user}</code></> : ', no login'}
                        {draft.mqtt.encryption ? '' : ', encryption off'}
                        {draft.mqtt.okToMqtt ? ', and OK to MQTT on' : ''}. MQTT needs the device on
                        Wi-Fi; it is switched on too when a network is set.</>
                    : 'Keeps the device\'s MQTT settings.'}
                </p>
              </fieldset>
            )}

            <div className="debug-report-actions">
              <button
                type="button"
                className="flasher-row-btn"
                onClick={requestClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                onClick={continueToFlash}
                disabled={!draftCount || !available || invalid || applying}
              >
                Continue to flash
              </button>
            </div>
            {!draftCount && (
              <p className="browser-note">Pick at least one setting.</p>
            )}
            {invalid && (
              <p className="browser-note">Fix the highlighted fields first.</p>
            )}
            {draftCount > 0 && (
              <p className="browser-note">
                Continue opens the installer. When the flash finishes, your choices
                are sent to the device automatically over the same connection.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
