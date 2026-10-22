// Customize: settings the flasher applies to a device over USB serial, using
// camillia-mt's `cfg` CLI (handleCfgCommand() in src/main_lvgl.cpp).
//
//   cfg caps                -> [cfg] caps v=1 firstboot=0|1 keys=preset presets=LongFast,...
//   cfg set preset <name>   -> [cfg] ok preset=<Name> staged | [cfg] err preset: ...
//   cfg commit              -> [cfg] ok committed preset=<Name> applies-after=setup|rebooting|unchanged
//
// On a fresh install the device holds the settings until on-device setup
// finishes; on an existing install, commit saves and reboots.

// Mirrors kPresets in camillia-mt's src/config_io.cpp. `name` is the channel
// name the firmware matches on; `tiny` marks the 15.6 kHz pair that only runs
// on radios with a TCXO (the device rejects them otherwise).
export const RADIO_PRESETS = [
  { name: 'LongFast',    label: 'Long Fast',     bw: 250,  sf: 11, cr: 5 },
  { name: 'LongMod',     label: 'Long Moderate', bw: 125,  sf: 11, cr: 8 },
  { name: 'LongSlow',    label: 'Long Slow',     bw: 125,  sf: 12, cr: 8 },
  { name: 'LongTurbo',   label: 'Long Turbo',    bw: 500,  sf: 11, cr: 8 },
  { name: 'MediumFast',  label: 'Medium Fast',   bw: 250,  sf: 9,  cr: 5 },
  { name: 'MediumSlow',  label: 'Medium Slow',   bw: 250,  sf: 10, cr: 5 },
  { name: 'MediumTurbo', label: 'Medium Turbo',  bw: 500,  sf: 9,  cr: 5 },
  { name: 'ShortFast',   label: 'Short Fast',    bw: 250,  sf: 7,  cr: 5 },
  { name: 'ShortSlow',   label: 'Short Slow',    bw: 250,  sf: 8,  cr: 5 },
  { name: 'ShortTurbo',  label: 'Short Turbo',   bw: 500,  sf: 7,  cr: 5 },
  { name: 'LiteFast',    label: 'Lite Fast',     bw: 125,  sf: 9,  cr: 5 },
  { name: 'LiteSlow',    label: 'Lite Slow',     bw: 125,  sf: 10, cr: 5 },
  { name: 'NarrowFast',  label: 'Narrow Fast',   bw: 62.5, sf: 7,  cr: 6 },
  { name: 'NarrowSlow',  label: 'Narrow Slow',   bw: 62.5, sf: 8,  cr: 6 },
  { name: 'TinyFast',    label: 'Tiny Fast',     bw: 15.6, sf: 7,  cr: 5, tiny: true },
  { name: 'TinySlow',    label: 'Tiny Slow',     bw: 15.6, sf: 8,  cr: 6, tiny: true },
]

export const EMPTY_CUSTOMIZATION = { preset: '' }

const STORAGE_KEY = 'camillia.customize'

export function loadCustomization() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    const preset = RADIO_PRESETS.some(p => p.name === saved?.preset) ? saved.preset : ''
    return { ...EMPTY_CUSTOMIZATION, preset }
  } catch {
    return { ...EMPTY_CUSTOMIZATION }
  }
}

export function saveCustomization(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {}
}

export function customizationCount(settings) {
  return settings?.preset ? 1 : 0
}

export function presetLabel(name) {
  return RADIO_PRESETS.find(p => p.name === name)?.label ?? name
}

// Parses "[cfg] caps v=1 firstboot=1 keys=preset presets=LongFast,LongMod".
export function parseCaps(line) {
  const out = { version: 0, firstBoot: false, keys: [], presets: [] }
  const body = line.slice(line.indexOf('[cfg] caps') + '[cfg] caps'.length)
  for (const token of body.trim().split(/\s+/)) {
    const eq = token.indexOf('=')
    if (eq < 0) continue
    const key = token.slice(0, eq)
    const value = token.slice(eq + 1)
    if (key === 'v') out.version = Number(value) || 0
    else if (key === 'firstboot') out.firstBoot = value === '1'
    else if (key === 'keys') out.keys = value.split(',').filter(Boolean)
    else if (key === 'presets') out.presets = value.split(',').filter(Boolean)
  }
  return out
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// The device may still be booting from the flash, or be reset by the port
// opening, so caps is retried until it answers or this runs out.
const PROBE_WINDOW_MS = 20_000
const PROBE_INTERVAL_MS = 1_500
const REPLY_TIMEOUT_MS = 4_000

export class CustomizeError extends Error {}

// Applies `settings` to an already-opened port. `log` receives progress text.
// Resolves to { firstBoot, outcome } where outcome is the commit's last word:
// 'setup' (held until on-device setup completes), 'rebooting', 'unchanged'.
export async function applyCustomization(port, settings, log = () => {}) {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  const reader = port.readable.getReader()
  const writer = port.writable.getWriter()
  const waiters = new Set()
  let pending = ''
  let closed = false

  const pump = (async () => {
    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        pending += decoder.decode(value, { stream: true })
        const lines = pending.split(/\r?\n/)
        pending = lines.pop() ?? ''
        for (const line of lines) {
          for (const waiter of [...waiters]) {
            if (waiter.match(line)) {
              waiters.delete(waiter)
              waiter.resolve(line)
            }
          }
        }
      }
    } catch {}
    closed = true
    for (const waiter of waiters) waiter.resolve(null)
    waiters.clear()
  })()

  function waitForLine(match, timeoutMs) {
    if (closed) return Promise.resolve(null)
    return new Promise(resolve => {
      const waiter = { match, resolve }
      waiters.add(waiter)
      setTimeout(() => {
        if (waiters.delete(waiter)) resolve(null)
      }, timeoutMs)
    })
  }

  const send = text => writer.write(encoder.encode(`${text}\n`))

  async function command(text, match) {
    const reply = waitForLine(match, REPLY_TIMEOUT_MS)
    await send(text)
    const line = await reply
    if (!line) throw new CustomizeError(`The device did not answer "${text}".`)
    return line.slice(line.indexOf('[cfg]'))
  }

  try {
    log('Waiting for the device to answer...')
    let caps = null
    const deadline = Date.now() + PROBE_WINDOW_MS
    while (!caps && Date.now() < deadline && !closed) {
      const reply = waitForLine(
        line => line.includes('[cfg] caps') || /\[cli\] unknown command: cfg/.test(line),
        PROBE_INTERVAL_MS
      )
      await send('\ncfg caps')
      const line = await reply
      if (!line) continue
      if (line.includes('[cli] unknown command')) {
        throw new CustomizeError(
          'This firmware does not support customization. Flash a newer Camillia-MT release and try again.'
        )
      }
      caps = parseCaps(line)
    }
    if (!caps) {
      throw new CustomizeError(
        closed
          ? 'The device disconnected before it answered.'
          : 'The device did not answer. Make sure it has finished booting, then try again.'
      )
    }

    if (settings.preset) {
      if (caps.presets.length && !caps.presets.some(p => p.toLowerCase() === settings.preset.toLowerCase())) {
        throw new CustomizeError(`${presetLabel(settings.preset)} is not supported by this device's radio.`)
      }
      log(`Setting radio preset to ${presetLabel(settings.preset)}...`)
      const set = await command(`cfg set preset ${settings.preset}`, line => /\[cfg\] (ok|err) preset/.test(line))
      if (set.startsWith('[cfg] err')) throw new CustomizeError(set.replace(/^\[cfg\] err\s*/, ''))
    }

    log('Saving on the device...')
    const commit = await command('cfg commit', line => /\[cfg\] (ok|err) (committed|nothing|commit)/.test(line))
    if (commit.startsWith('[cfg] err')) throw new CustomizeError(commit.replace(/^\[cfg\] err\s*/, ''))
    const outcome = /applies-after=setup/.test(commit)
      ? 'setup'
      : /rebooting/.test(commit)
        ? 'rebooting'
        : 'unchanged'
    return { firstBoot: caps.firstBoot, outcome }
  } finally {
    // Give a rebooting device's last line a moment, then let go of the port.
    await delay(100)
    try { await reader.cancel() } catch {}
    await pump
    try { reader.releaseLock() } catch {}
    try { writer.releaseLock() } catch {}
  }
}
