import { THEMES, paletteStyle } from '../themes.js'
import ModeToggle from './ModeToggle.jsx'

// Miniature of the channel view. Deliberately abstract — at this size real text
// is mush, but the panel/pill/row structure still reads as the device screen.
function ThemeChip({ palette }) {
  return (
    <span className="chip" style={paletteStyle(palette)} aria-hidden="true">
      <span className="chip-status">
        <span className="chip-pill" />
        <span className="chip-batt" />
      </span>
      <span className="chip-row" style={{ width: '78%' }} />
      <span className="chip-row chip-row-own" style={{ width: '58%' }} />
      <span className="chip-row" style={{ width: '86%' }} />
      <span className="chip-keys" />
    </span>
  )
}

export default function ThemeRail({ theme, mode, modeLocked, onModeChange, onThemeChange }) {
  return (
    <section id="themes" className="band">
      <div className="container">
        <p className="eyebrow">Appearance</p>
        <h2>Thirteen palettes, straight off the device</h2>
        <p className="measure">
          Each palette is computed from the same four anchor colors the firmware
          stores, run through the same blend it does at boot. Pick one and this
          page and your device show you the identical thing.
        </p>

        <div className="rail-head">
          <ModeToggle mode={mode} locked={modeLocked} onChange={onModeChange} />
          {modeLocked && (
            <p className="rail-note">Camillia Black is dark only.</p>
          )}
        </div>

        <ul className="rail" role="list">
          {THEMES.map(t => {
            const active = t.id === theme.id
            return (
              <li key={t.id}>
                <button
                  type="button"
                  className="rail-item"
                  aria-pressed={active}
                  onClick={() => onThemeChange({ ...theme, id: t.id })}
                >
                  <ThemeChip palette={mode === 'light' ? t.light : t.dark} />
                  <span className="rail-name">{t.name}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
