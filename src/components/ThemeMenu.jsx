import { THEMES } from '../themes.js'

// Compact theme picker for the nav: a theme dropdown plus a dark/light toggle.
// Drives the same theme state as the rest of the site.
export default function ThemeMenu({ selected, onChange }) {
  return (
    <div className="theme-menu">
      <select
        className="theme-select"
        aria-label="Theme"
        value={selected.id}
        onChange={e => onChange({ ...selected, id: e.target.value })}
      >
        {THEMES.map(t => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
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
    </div>
  )
}
