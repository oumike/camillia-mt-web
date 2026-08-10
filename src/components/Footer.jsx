// The chat view's real shortcut row, verbatim from main_lvgl.cpp
// (`s_chatShortcutText`). Split so the bracketed key can take the accent color.
const KEY_LEGEND = [
  { key: 'C', before: '(', after: ')FG' },
  { key: 'h', before: 'C(', after: ')an' },
  { key: 'D', before: '(', after: ')M' },
  { key: 'N', before: '(', after: ')odes' },
  { key: 'L', before: '(', after: ')ive' },
  { key: 'A', before: '(', after: ')ct' },
]

export default function Footer() {
  return (
    <footer>
      <div className="container footer-inner">
        <p className="footer-mark">Camillia for Meshtastic · GPLv3</p>
        <p className="footer-keys" aria-hidden="true">
          {KEY_LEGEND.map(k => (
            <span key={k.key}>{k.before}<b>{k.key}</b>{k.after}</span>
          ))}
        </p>
        <p className="footer-links">
          <a href="https://github.com/oumike/camillia-mt" target="_blank" rel="noreferrer">Source</a>
          <a href="https://github.com/oumike/camillia-mt/releases" target="_blank" rel="noreferrer">Releases</a>
          <a href="https://github.com/oumike/camillia-mt/blob/main/LICENSE.md" target="_blank" rel="noreferrer">License</a>
        </p>
      </div>
    </footer>
  )
}
