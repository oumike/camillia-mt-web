import { withBase } from '../basePath'

export default function Nav() {
  return (
    <header className="nav">
      <div className="nav-inner">
        <a href="#top" className="brand">
          <img src={withBase('/favicon.svg')} alt="" />
          <span>Camillia-MT</span>
        </a>
        <div className="nav-spacer" />
        <a href="#features">Features</a>
        <a href="#devices">Devices</a>
        <a href="#screenshots">Screenshots</a>
        <a href="#themes">Themes</a>
        <a href="#flash">Flash</a>
        <a href="https://github.com/oumike/camillia-mt" target="_blank" rel="noreferrer">GitHub</a>
      </div>
    </header>
  )
}
