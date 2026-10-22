// Customize: settings the flasher applies to a device over USB serial, using
// camillia-mt's `cfg` CLI (handleCfgCommand() in src/main_lvgl.cpp).
//
//   cfg caps                -> [cfg] caps v=1 firstboot=0|1 keys=preset,channels,logo channels=10
//                              logo=WxH logobg=RRGGBB logomax=8192 presets=LongFast,...
//   cfg set preset <name>   -> [cfg] ok preset=<Name> staged | [cfg] err preset: ...
//   cfg channels clear      -> [cfg] ok channels cleared slots=N
//   cfg set channel <i> role=.. name=<%-encoded> psk=default|none|<base64> pos=0|1 up=0|1 down=0|1
//                           -> [cfg] ok channel <i> staged | [cfg] err channel ...
//   cfg logo begin <bytes>, cfg logo data <hex>, cfg logo end <crc32>, cfg logo clear
//   cfg commit              -> [cfg] ok committed ... applies-after=setup|rebooting|unchanged
//   cfg abort               -> [cfg] ok aborted
//
// On a fresh install the device holds the settings until on-device setup
// finishes; on an existing install, commit saves and reboots.

import { withBase } from './basePath'

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

// Firmware limits: MESH_CHANNELS is 10 (8 on the Cardputer), and Meshtastic
// channel names are at most 11 bytes.
export const MAX_CHANNELS = 10
export const CHANNEL_NAME_MAX = 11

// The splash card colour (Camillia Dark panelBg), for the preview. Applying
// uses the colour the device reports.
export const SPLASH_CARD_BG = '#100C29'

// A channel: psk is 'default' (AQ==), 'none', or a base64 key of 1, 16 or 32
// bytes. An empty primary name means "named after the preset".
const PRIMARY_CHANNEL = { name: '', psk: 'default', pos: true, up: true, down: false }
const secondary = (name, psk) => ({ name, psk, pos: false, up: false, down: false })
const CHICAGO_PSK = 'H1HDyEqg5W9XFilicVTIaoWYrs8URmWGo5fAYfbxQgo='

export function newChannel(index) {
  return index === 0 ? { ...PRIMARY_CHANNEL } : secondary('', 'default')
}

// Community setups, as published by each mesh. Only what the flasher can set
// is here; `notes` lists the rest of their advice. Logos are rendered from each
// community's own SVG (chicagolandmesh.org/assets/images/logo-clear.svg,
// michmesh.net/img/michmesh-logo-dark.svg).
export const PROFILES = [
  {
    id: 'chimesh',
    label: 'ChiMesh (Chicagoland)',
    url: 'https://chicagolandmesh.org/guides/meshtastic/getting-started/configure/',
    preset: 'LongFast',
    logo: withBase('/logos/chimesh.png'),
    channels: [PRIMARY_CHANNEL, secondary('Chicago', CHICAGO_PSK)],
    notes: 'ChiMesh also recommends hop limit 7, a 3-hour NodeInfo interval and MQTT via mqtt.chimesh.org (root topic msh/US/IL/Chi); set those on the device.',
  },
  {
    id: 'michmesh',
    label: 'MichMesh (Michigan)',
    url: 'https://michmesh.net/docs/Meshtastic/Getting%20Started',
    preset: 'LongFast',
    logo: withBase('/logos/michmesh.png'),
    channels: [
      PRIMARY_CHANNEL,
      secondary('Michigan', 'MA=='),
      secondary('WMI', 'MA=='),
      secondary('EMI', 'MA=='),
      secondary('Muskegon', 'MA=='),
      secondary('NMI', 'MA=='),
      secondary('YOOPER', 'MA=='),
      secondary('Washtenaw', 'MA=='),
      secondary('W8ZHO', 'none'),
      secondary('Chicago', CHICAGO_PSK),
    ],
    notes: 'W8ZHO and Chicago come from Muskegon Mesh. Ten channels need a device with ten slots (the Cardputer has eight). MichMesh also recommends "OK to MQTT" with root topic msh/US/MI; set that on the device.',
  },
]

export const EMPTY_CUSTOMIZATION = { preset: '', channels: null, logo: '' }

const STORAGE_KEY = 'camillia.customize'

function base64Bytes(text) {
  try {
    const bin = atob(text.replace(/-/g, '+').replace(/_/g, '/'))
    return bin.length
  } catch {
    return -1
  }
}

export function channelNameBytes(name) {
  return new TextEncoder().encode(name).length
}

// '' when the channel is valid, otherwise why not.
export function channelError(channel, index) {
  const name = channel.name.trim()
  if (channelNameBytes(name) > CHANNEL_NAME_MAX) return `Names are at most ${CHANNEL_NAME_MAX} bytes.`
  if (index > 0 && !name) return 'Give the channel a name.'
  if (channel.psk !== 'default' && channel.psk !== 'none' && ![1, 16, 32].includes(base64Bytes(channel.psk.trim()))) {
    return 'The key must be base64 of 1, 16 or 32 bytes.'
  }
  return ''
}

export function customizationErrors(settings) {
  if (!settings.channels) return []
  return settings.channels.map(channelError)
}

export function randomPsk(bytes = 32) {
  const key = crypto.getRandomValues(new Uint8Array(bytes))
  return btoa(String.fromCharCode(...key))
}

function cleanChannel(raw, index) {
  const base = newChannel(index)
  if (!raw || typeof raw !== 'object') return base
  return {
    name: typeof raw.name === 'string' ? raw.name : base.name,
    psk: typeof raw.psk === 'string' && raw.psk ? raw.psk : base.psk,
    pos: typeof raw.pos === 'boolean' ? raw.pos : base.pos,
    up: typeof raw.up === 'boolean' ? raw.up : base.up,
    down: typeof raw.down === 'boolean' ? raw.down : base.down,
  }
}

export function loadCustomization() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    const preset = RADIO_PRESETS.some(p => p.name === saved?.preset) ? saved.preset : ''
    const channels = Array.isArray(saved?.channels) && saved.channels.length
      ? saved.channels.slice(0, MAX_CHANNELS).map(cleanChannel)
      : null
    const logo = saved?.logo === 'clear' || /^data:image\/png;base64,/.test(saved?.logo ?? '') ? saved.logo : ''
    return { ...EMPTY_CUSTOMIZATION, preset, channels, logo }
  } catch {
    return { ...EMPTY_CUSTOMIZATION }
  }
}

// False when the browser would not keep it (a large logo can exceed the quota).
export function saveCustomization(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    return true
  } catch {
    return false
  }
}

export function customizationCount(settings) {
  return (settings?.preset ? 1 : 0) + (settings?.channels ? 1 : 0) + (settings?.logo ? 1 : 0)
}

export function presetLabel(name) {
  return RADIO_PRESETS.find(p => p.name === name)?.label ?? name
}

// Parses "[cfg] caps v=1 firstboot=1 keys=preset,channels,logo channels=10
// logo=296x60 logobg=100C29 logomax=8192 presets=LongFast,LongMod".
export function parseCaps(line) {
  const out = { version: 0, firstBoot: false, keys: [], presets: [], channels: 0, logo: null }
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
    else if (key === 'channels') out.channels = Number(value) || 0
    else if (key === 'logo') {
      const [w, h] = value.split('x').map(Number)
      if (w > 0 && h > 0) out.logo = { ...out.logo, width: w, height: h }
    } else if (key === 'logobg' && /^[0-9a-f]{6}$/i.test(value)) out.logo = { ...out.logo, bg: `#${value}` }
    else if (key === 'logomax') out.logo = { ...out.logo, maxBytes: Number(value) || 0 }
  }
  if (out.logo && !(out.logo.width && out.logo.height && out.logo.maxBytes)) out.logo = null
  return out
}

// Percent-encodes everything but plain ASCII, so a name survives a
// space-separated line; the firmware decodes it byte for byte.
export function encodeChannelName(name) {
  return Array.from(new TextEncoder().encode(name), b =>
    /[A-Za-z0-9_.~-]/.test(String.fromCharCode(b)) ? String.fromCharCode(b) : `%${b.toString(16).toUpperCase().padStart(2, '0')}`
  ).join('')
}

export function channelCommand(channel, index) {
  const role = index === 0 ? 'primary' : 'secondary'
  const psk = channel.psk === 'default' || channel.psk === 'none' ? channel.psk : channel.psk.trim()
  return `cfg set channel ${index} role=${role} name=${encodeChannelName(channel.name.trim())} psk=${psk}`
    + ` pos=${channel.pos ? 1 : 0} up=${channel.up ? 1 : 0} down=${channel.down ? 1 : 0}`
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

export function crc32(bytes) {
  let crc = 0xFFFFFFFF
  for (const b of bytes) crc = CRC_TABLE[(crc ^ b) & 0xFF] ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new CustomizeError('That file could not be read as an image.'))
    img.src = src
  })
}

function canvasPng(canvas) {
  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
}

// Turns a chosen file (or a same-origin image URL) into a PNG data URL small
// enough to remember in the browser; the device-sized version is made at apply
// time.
export async function prepareLogoSource(source) {
  const isUrl = typeof source === 'string'
  const url = isUrl ? source : URL.createObjectURL(source)
  try {
    const img = await loadImage(url)
    const scale = Math.min(1, 640 / img.naturalWidth, 320 / img.naturalHeight)
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/png')
  } finally {
    if (!isUrl) URL.revokeObjectURL(url)
  }
}

// Fits the logo to the device's box, flattened onto the card colour (the
// splash has no alpha to blend with), shrinking until it fits in NVS.
export async function renderLogoForDevice(dataUrl, box) {
  const img = await loadImage(dataUrl)
  let scale = Math.min(1, box.width / img.naturalWidth, box.height / img.naturalHeight)
  for (let attempt = 0; attempt < 12; attempt++) {
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.floor(img.naturalWidth * scale))
    canvas.height = Math.max(1, Math.floor(img.naturalHeight * scale))
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = box.bg || SPLASH_CARD_BG
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const blob = await canvasPng(canvas)
    if (blob && blob.size <= box.maxBytes) return new Uint8Array(await blob.arrayBuffer())
    scale *= 0.85
  }
  throw new CustomizeError('The logo is too detailed to fit on the device. Try a simpler image.')
}

const LOGO_CHUNK_BYTES = 112   // 224 hex characters: inside the device's 256-byte line

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
  let committed = false

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

    const wants = key => {
      if (caps.keys.includes(key)) return
      throw new CustomizeError(
        `This firmware cannot set the ${key === 'logo' ? 'boot logo' : key}. Flash a newer Camillia-MT release and try again.`
      )
    }
    const fail = reply => { throw new CustomizeError(reply.replace(/^\[cfg\] err\s*/, '')) }

    if (settings.preset) {
      if (caps.presets.length && !caps.presets.some(p => p.toLowerCase() === settings.preset.toLowerCase())) {
        throw new CustomizeError(`${presetLabel(settings.preset)} is not supported by this device's radio.`)
      }
      log(`Setting radio preset to ${presetLabel(settings.preset)}...`)
      const set = await command(`cfg set preset ${settings.preset}`, line => /\[cfg\] (ok|err) preset/.test(line))
      if (set.startsWith('[cfg] err')) fail(set)
    }

    if (settings.channels) {
      wants('channels')
      if (caps.channels && settings.channels.length > caps.channels) {
        throw new CustomizeError(
          `This device has ${caps.channels} channel slots and you have ${settings.channels.length} channels. Remove ${settings.channels.length - caps.channels} and try again.`
        )
      }
      log(`Setting ${settings.channels.length} channel${settings.channels.length === 1 ? '' : 's'}...`)
      const cleared = await command('cfg channels clear', line => /\[cfg\] (ok|err) channels/.test(line))
      if (cleared.startsWith('[cfg] err')) fail(cleared)
      for (const [index, channel] of settings.channels.entries()) {
        const set = await command(channelCommand(channel, index), line => /\[cfg\] (ok|err) channel/.test(line))
        if (set.startsWith('[cfg] err')) fail(set)
      }
    }

    if (settings.logo === 'clear') {
      wants('logo')
      log('Restoring the default boot title...')
      const cleared = await command('cfg logo clear', line => /\[cfg\] (ok|err) logo/.test(line))
      if (cleared.startsWith('[cfg] err')) fail(cleared)
    } else if (settings.logo) {
      wants('logo')
      if (!caps.logo) throw new CustomizeError('This device does not show a boot logo.')
      const png = await renderLogoForDevice(settings.logo, caps.logo)
      const begun = await command(`cfg logo begin ${png.length}`, line => /\[cfg\] (ok|err) logo/.test(line))
      if (begun.startsWith('[cfg] err')) fail(begun)
      for (let offset = 0; offset < png.length; offset += LOGO_CHUNK_BYTES) {
        log(`Sending boot logo... ${Math.round((offset / png.length) * 100)}%`)
        const hex = Array.from(png.subarray(offset, offset + LOGO_CHUNK_BYTES), b => b.toString(16).padStart(2, '0')).join('')
        const ack = await command(`cfg logo data ${hex}`, line => /\[cfg\] (ok|err) logo/.test(line))
        if (ack.startsWith('[cfg] err')) fail(ack)
      }
      const ended = await command(`cfg logo end ${crc32(png).toString(16).padStart(8, '0')}`, line => /\[cfg\] (ok|err) logo/.test(line))
      if (ended.startsWith('[cfg] err')) fail(ended)
    }

    log('Saving on the device...')
    const commit = await command('cfg commit', line => /\[cfg\] (ok|err) (committed|nothing|commit)/.test(line))
    if (commit.startsWith('[cfg] err')) fail(commit)
    const outcome = /applies-after=setup/.test(commit)
      ? 'setup'
      : /rebooting/.test(commit)
        ? 'rebooting'
        : 'unchanged'
    committed = true
    return { firstBoot: caps.firstBoot, outcome }
  } finally {
    // Nothing half-sent may be committed by a later attempt.
    if (!committed && !closed) {
      try { await send('cfg abort') } catch {}
    }
    // Give a rebooting device's last line a moment, then let go of the port.
    await delay(100)
    try { await reader.cancel() } catch {}
    await pump
    try { reader.releaseLock() } catch {}
    try { writer.releaseLock() } catch {}
  }
}
