import { THEMES, paletteHex } from '../themes.js'

function DevicePreview({ themeId, mode }) {
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0]
  const palette = paletteHex(mode === 'light' ? theme.light : theme.dark)
  // Inline style overrides so the preview shows the *focused* theme even
  // before the user commits to applying it across the whole site.
  const style = {
    '--bg-main': palette.bgMain,
    '--status-bg': palette.statusBg,
    '--panel-bg': palette.panelBg,
    '--panel-alt': palette.panelAlt,
    '--divider': palette.divider,
    '--divider-hi': palette.dividerHi,
    '--accent': palette.accent,
    '--tab-active': palette.tabActive,
    '--tab-unread': palette.tabUnread,
    '--tab-idle': palette.tabIdle,
    '--text-main': palette.textMain,
    '--text-dim': palette.textDim,
    '--text-on-accent': palette.textOnAccent,
    '--input-bg': palette.inputBg,
    '--input-top': palette.inputTop,
  }
  return (
    <div className="preview" style={style}>
      <div className="statusbar">
        <span className="dot" />
        <span>camillia · #general</span>
        <span style={{ marginLeft: 'auto', opacity: 0.7 }}>87% · 19:42</span>
      </div>
      <div className="tabs">
        <span className="tab active">GEN</span>
        <span className="tab unread">RES</span>
        <span className="tab">DM</span>
        <span className="tab">ANN</span>
        <span className="tab">CFG</span>
      </div>
      <div className="panel">
        <div className="msg"><span className="nick">w0lf:</span>net check, anybody copy?</div>
        <div className="msg"><span className="nick">RiCa:</span>5/9 from the ridge. clear skies up here.</div>
        <div className="msg"><span className="nick">k7tx:</span>same, copying everyone full quieting.</div>
        <div className="input">› type a message…</div>
      </div>
    </div>
  )
}

export default function ThemePicker({ selected, onChange }) {
  return (
    <section id="themes">
      <div className="container">
        <h2>Themes</h2>
        <p>
          The firmware ships 12 hand-tuned themes, each with a dark and light
          mode. Pick one — this whole site re-themes to match what you would
          see on-device.
        </p>

        <div className="themes-bar" style={{ marginTop: 24 }}>
          <div className="mode-toggle" role="group" aria-label="Theme mode">
            <button
              aria-pressed={selected.mode === 'dark'}
              onClick={() => onChange({ ...selected, mode: 'dark' })}
            >Dark</button>
            <button
              aria-pressed={selected.mode === 'light'}
              onClick={() => onChange({ ...selected, mode: 'light' })}
            >Light</button>
          </div>
          <div style={{ flexBasis: '100%', height: 0 }} />
          {THEMES.map(t => {
            const palette = paletteHex(selected.mode === 'light' ? t.light : t.dark)
            const active = t.id === selected.id
            return (
              <button
                key={t.id}
                className="theme-swatch"
                aria-pressed={active}
                onClick={() => onChange({ id: t.id, mode: selected.mode })}
              >
                <span className="swatch-dot" style={{ background: palette.bgMain }} />
                <span className="swatch-dot" style={{ background: palette.panelAlt }} />
                <span className="swatch-dot" style={{ background: palette.accent }} />
                <span>{t.name}</span>
              </button>
            )
          })}
        </div>

        <div className="preview-grid">
          <div>
            <h3 style={{ color: 'var(--text-main)' }}>Live preview</h3>
            <p>
              The mock to the right uses the colors of the currently focused
              theme exactly the way the firmware composes them at runtime.
            </p>
          </div>
          <DevicePreview themeId={selected.id} mode={selected.mode} />
        </div>
      </div>
    </section>
  )
}
