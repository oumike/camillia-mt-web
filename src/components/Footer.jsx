export default function Footer() {
  return (
    <footer>
      <div className="container" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <span>Camillia-MT · GPLv3</span>
        <span style={{ flex: 1 }} />
        <a href="https://github.com/oumike/camillia-mt" target="_blank" rel="noreferrer">Source</a>
        <a href="https://github.com/oumike/camillia-mt/releases" target="_blank" rel="noreferrer">Releases</a>
        <a href="https://github.com/oumike/camillia-mt/blob/main/docs/USE.md" target="_blank" rel="noreferrer">Usage guide</a>
      </div>
    </footer>
  )
}
