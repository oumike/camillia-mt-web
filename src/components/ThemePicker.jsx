import { THEMES, paletteHex } from '../themes.js'

function DevicePreview({ themeId, mode }) {
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0]
  const palette = paletteHex(mode === 'light' ? theme.light : theme.dark)
  // Inline style overrides so the preview shows the *focused* theme even
  // before the user commits to applying it across the whole site.
  const style = {
    '--bg-main': palette.bgMain,
    '--status-top': palette.statusTop,
    '--status-bg': palette.statusBg,
    '--panel-bg': palette.panelBg,
    '--panel-alt': palette.panelAlt,
    '--panel-strong': palette.panelStrong,
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
    <div className="preview preview-fw" style={style}>
      <div className="fw-statusbar">
        <span className="fw-pill fw-pill-active">LongFast</span>
        <span className="fw-stat">RF</span>
        <span className="fw-stat">GPS 7</span>
        <span className="fw-time">11:05</span>
        <span className="fw-batt">
          <span className="fw-batt-fill" />
        </span>
        <span className="fw-stat">100%</span>
      </div>
      <div className="fw-channel">Michigan</div>
      <div className="fw-log">
        <div className="fw-row fw-rx"><span className="fw-ts">10:59</span> eastsidemesh.com join the signal chat and help us build up!</div>
        <div className="fw-row fw-rx"><span className="fw-ts">11:00</span> [i] Hello Detroit!</div>
        <div className="fw-row fw-rx"><span className="fw-ts">17:19</span> [RiJa] w</div>
        <div className="fw-row fw-rx"><span className="fw-ts">17:19</span> [RiJa] hi</div>
        <div className="fw-row fw-tx"><span className="fw-ts">11:03</span> Once you force yourself to move around, mornings get easier.</div>
      </div>
      <div className="fw-compose">Type message...</div>
      <div className="fw-tabs">
        <span className="fw-tab fw-tab-active">(DM)</span>
        <span className="fw-tab">(C)FG</span>
        <span className="fw-tab">(N)odes</span>
        <span className="fw-tab">(L)ive</span>
        <span className="fw-tab">(L)egend</span>
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
              The mock to the right mirrors the firmware channel screen layout
              while using the currently focused theme colors.
            </p>
          </div>
          <DevicePreview themeId={selected.id} mode={selected.mode} />
        </div>
      </div>
    </section>
  )
}
