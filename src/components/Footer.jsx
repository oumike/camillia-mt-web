import { KEY_LEGEND } from './DeviceScreen.jsx'

export default function Footer() {
  return (
    <footer>
      <div className="container footer-inner">
        <p className="footer-mark">Camillia for Meshtastic · GPLv3</p>
        <p className="footer-keys" aria-hidden="true">
          {KEY_LEGEND.map(k => (
            <span key={k.key}>(<b>{k.key}</b>){k.rest}</span>
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
