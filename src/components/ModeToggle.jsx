// Dark/light switch. Some themes ship dark-only, so Light can be locked out;
// when it is, the button says why rather than silently doing nothing.
export default function ModeToggle({ mode, locked, onChange, size }) {
  return (
    <div className={size === 'sm' ? 'mode-toggle mode-toggle-sm' : 'mode-toggle'}
         role="group" aria-label="Light or dark">
      <button type="button" aria-pressed={mode === 'dark'}
              onClick={() => onChange('dark')}>Dark</button>
      <button type="button" aria-pressed={!locked && mode === 'light'}
              disabled={locked}
              title={locked ? 'This theme is dark only' : undefined}
              onClick={() => onChange('light')}>Light</button>
    </div>
  )
}
