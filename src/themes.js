// Theme palettes ported from camillia-mt firmware:
//   src/main_lvgl.cpp — kUiThemePresets table + applyUiThemePalette()
//
// Each preset stores four anchor rgb565 values: bgMain, panelBg, panelAlt, accent.
// All derived colors (status bar, dividers, text, etc.) are computed from those
// anchors using the same blend logic the firmware uses at runtime, so the
// website renders the same colors a user sees on-device.

const rgb565 = (r, g, b) => ((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3)
const anchors = (bg, panel, panelAlt, accent) => ({
  bgMain: rgb565(...bg),
  panelBg: rgb565(...panel),
  panelAlt: rgb565(...panelAlt),
  accent: rgb565(...accent),
})

const PRESETS = [
  { id: 'camellia', name: 'Camillia',
    dark:  { bgMain: 0x0843, panelBg: 0x1065, panelAlt: 0x18A7, accent: 0xDA8E },
    light: anchors([0xff,0xf7,0xfa], [0xff,0xfd,0xfe], [0xf8,0xee,0xf3], [0xb0,0x2f,0x62]) },
  { id: 'evergreen', name: 'Evergreen',
    dark:  { bgMain: 0x00A8, panelBg: 0x11AA, panelAlt: 0x1A2C, accent: 0x55B0 },
    light: { bgMain: 0xE73C, panelBg: 0xF7DE, panelAlt: 0xE71B, accent: 0x2D2A } },
  { id: 'earthen', name: 'Earthen',
    dark:  { bgMain: 0x1082, panelBg: 0x2104, panelAlt: 0x2945, accent: 0xD38B },
    light: { bgMain: 0xF7DE, panelBg: 0xFFDF, panelAlt: 0xF75C, accent: 0xB40B } },
  { id: 'solarized', name: 'Solarized',
    dark:  anchors([0x00,0x2b,0x36], [0x07,0x36,0x42], [0x0c,0x3c,0x47], [0x2a,0xa1,0x98]),
    light: anchors([0xee,0xe8,0xd5], [0xfd,0xf6,0xe3], [0xee,0xe8,0xd5], [0x2a,0xa1,0x98]) },
  { id: 'crimson', name: 'Crimson Blue',
    dark:  anchors([0x06,0x0f,0x24], [0x12,0x24,0x4c], [0x1b,0x33,0x63], [0xff,0x4a,0x58]),
    light: anchors([0xf3,0xf7,0xff], [0xf8,0xfb,0xff], [0xe6,0xef,0xff], [0xc6,0x28,0x39]) },
  { id: 'scarlet', name: 'Scarlet Pop',
    dark:  anchors([0x15,0x00,0x09], [0x76,0x00,0x31], [0x8b,0x00,0x38], [0xd5,0x1c,0x39]),
    light: anchors([0xff,0xf2,0xf4], [0xff,0xf8,0xf9], [0xff,0xea,0xed], [0xd5,0x1c,0x39]) },
  { id: 'inkwash', name: 'Ink Wash',
    dark:  anchors([0x11,0x13,0x18], [0x1C,0x21,0x28], [0x25,0x2B,0x34], [0xD8,0xDD,0xE4]),
    light: anchors([0xF3,0xF5,0xF7], [0xFF,0xFF,0xFF], [0xE8,0xEB,0xEF], [0x2E,0x34,0x40]) },
  { id: 'lavender', name: 'Lavendar Fields',
    dark:  anchors([0x1A,0x12,0x30], [0x25,0x1A,0x45], [0x2F,0x22,0x58], [0xB7,0x9B,0xFF]),
    light: anchors([0xF5,0xEF,0xFB], [0xFF,0xF9,0xFF], [0xED,0xE1,0xF7], [0x7B,0x5B,0xA7]) },
  { id: 'wildflowers', name: 'Wild Flowers',
    dark:  anchors([0x1A,0x24,0x30], [0x25,0x35,0x47], [0x2D,0x45,0x5B], [0xC7,0x8F,0xCF]),
    light: anchors([0xF6,0xFA,0xF4], [0xFF,0xFF,0xFF], [0xE5,0xF0,0xE2], [0x8A,0x5F,0xAF]) },
  { id: 'quietluxury', name: 'Quiet Luxury',
    dark:  anchors([0x2A,0x1F,0x17], [0x34,0x27,0x1E], [0x40,0x31,0x26], [0xD9,0xC7,0xA3]),
    light: anchors([0xFA,0xF4,0xEA], [0xFF,0xFD,0xF8], [0xF1,0xE7,0xD5], [0xA8,0x84,0x4F]) },
  { id: 'morningdew', name: 'Morning Dew',
    dark:  anchors([0x12,0x28,0x2A], [0x1A,0x36,0x38], [0x23,0x43,0x45], [0x9C,0xD8,0xC8]),
    light: anchors([0xEE,0xF9,0xF6], [0xFF,0xFF,0xFF], [0xDD,0xF1,0xEC], [0x4E,0x9C,0x8A]) },
  { id: 'winterchill', name: 'Winter Chill',
    dark:  anchors([0x15,0x1F,0x2B], [0x1C,0x2A,0x3A], [0x24,0x36,0x49], [0x8F,0xB3,0xD9]),
    light: anchors([0xF1,0xF7,0xFC], [0xFF,0xFF,0xFF], [0xDF,0xEB,0xF6], [0x5C,0x86,0xB2]) },
  // Dark only — the firmware ships no light variant for this one.
  { id: 'camellia-black', name: 'Camillia Black', darkOnly: true,
    dark: anchors([0x00,0x00,0x00], [0x00,0x00,0x00], [0x0A,0x0A,0x0A], [0xFF,0xFF,0xFF]),
    // main_lvgl.cpp special-cases this theme so the accent blend never lifts
    // black to grey. On the web the failure is the mirror image: the derived
    // divider lands on near-black and every panel edge vanishes against the
    // page. Lift that one value; leave the rest of the derivation alone.
    fix: p => ({ ...p, divider: rgb565(0x26, 0x26, 0x26) }) },
]

function toHex(c) {
  const r = ((c >> 11) & 0x1F) * 255 / 31 | 0
  const g = ((c >> 5)  & 0x3F) * 255 / 63 | 0
  const b = (c & 0x1F) * 255 / 31 | 0
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}

// blend565 from firmware (t is 0..255)
function blend565(c1, c2, t) {
  const r1 = (c1 >> 11) & 0x1F, g1 = (c1 >> 5) & 0x3F, b1 = c1 & 0x1F
  const r2 = (c2 >> 11) & 0x1F, g2 = (c2 >> 5) & 0x3F, b2 = c2 & 0x1F
  const r = (r1 + ((r2 - r1) * t / 255 | 0)) & 0x1F
  const g = (g1 + ((g2 - g1) * t / 255 | 0)) & 0x3F
  const b = (b1 + ((b2 - b1) * t / 255 | 0)) & 0x1F
  return (r << 11) | (g << 5) | b
}

// Mirrors applyUiThemePalette() in main_lvgl.cpp.
function derivePalette({ bgMain, panelBg, panelAlt, accent }, isLight) {
  const statusTop   = blend565(bgMain, panelBg, isLight ? 128 : 96)
  const statusBg    = isLight ? panelAlt : panelBg
  const panelStrong = blend565(panelAlt, accent, isLight ? 36 : 48)
  const tabActive   = accent
  const tabUnread   = blend565(accent, rgb565(0xFF, 0xB3, 0x00), 92)
  const tabIdle     = blend565(panelAlt, bgMain, isLight ? 90 : 120)
  const divider     = blend565(panelAlt, bgMain, isLight ? 135 : 150)
  const dividerHi   = blend565(panelAlt, accent, isLight ? 74 : 92)
  const inputBg     = panelAlt
  const inputTop    = blend565(panelBg, panelAlt, 120)

  const textMain    = isLight ? rgb565(0x1E, 0x24, 0x2C) : rgb565(0xF3, 0xF6, 0xFA)
  const textDim     = isLight ? rgb565(0x5E, 0x68, 0x76) : rgb565(0xB7, 0xC0, 0xCC)
  const textOnAccent = isLight ? rgb565(0xFF, 0xFF, 0xFF) : rgb565(0x08, 0x0D, 0x14)

  const selectBg    = blend565(panelAlt, accent, isLight ? 36 : 44)
  return {
    bgMain, statusTop, statusBg, panelBg, panelAlt, panelStrong,
    tabActive, tabUnread, tabIdle, divider, dividerHi, inputBg, inputTop,
    accent, textMain, textDim, textOnAccent, selectBg,
  }
}

export const THEMES = PRESETS.map(p => {
  const fix = p.fix || (x => x)
  const dark = fix(derivePalette(p.dark, false))
  return {
    id: p.id,
    name: p.name,
    darkOnly: !!p.darkOnly,
    dark,
    // A dark-only theme answers "light" with its dark palette, so callers
    // never have to special-case it.
    light: p.darkOnly ? dark : fix(derivePalette(p.light, true)),
  }
})

export function isDarkOnly(themeId) {
  return !!THEMES.find(t => t.id === themeId)?.darkOnly
}

export const THEME_VAR_KEYS = [
  'bgMain', 'statusTop', 'statusBg', 'panelBg', 'panelAlt', 'panelStrong',
  'tabActive', 'tabUnread', 'tabIdle', 'divider', 'dividerHi', 'inputBg', 'inputTop',
  'accent', 'textMain', 'textDim', 'textOnAccent', 'selectBg',
]

export function applyTheme(rootEl, themeId, mode) {
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0]
  const effectiveMode = theme.darkOnly ? 'dark' : mode
  const palette = (effectiveMode === 'light') ? theme.light : theme.dark
  for (const key of THEME_VAR_KEYS) {
    rootEl.style.setProperty('--' + camelToKebab(key), toHex(palette[key]))
  }
  rootEl.dataset.theme = theme.id
  rootEl.dataset.mode = effectiveMode
}

export function paletteHex(palette) {
  const out = {}
  for (const key of THEME_VAR_KEYS) out[key] = toHex(palette[key])
  return out
}

// Same palette as CSS custom properties, ready to spread into a React style
// prop. Lets one subtree render in a theme other than the document's.
export function paletteStyle(palette) {
  const out = {}
  for (const key of THEME_VAR_KEYS) {
    out['--' + camelToKebab(key)] = toHex(palette[key])
  }
  return out
}

function camelToKebab(s) {
  return s.replace(/[A-Z]/g, ch => '-' + ch.toLowerCase())
}
