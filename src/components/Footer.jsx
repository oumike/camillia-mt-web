import { useEffect, useState } from 'react'

// Buy Me a Coffee's button, using the same trick sumat.org does.
//
// Their script ends in document.writeln(), which does nothing (or wipes the
// page) once the parser has finished -- so it cannot simply be dropped in as a
// <script> tag, and a tag injected from an effect has its write ignored. But it
// only takes that path when it finds its own script[data-name="bmc-button"] in
// the DOM. Loaded without one it writes nothing and just leaves
// window.bmcBtnWidget behind, which we call with the same values and render
// ourselves. That gets the real button rather than an approximation of it.
const BMC_SCRIPT = 'https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js'
const BMC_URL = 'https://buymeacoffee.com/oumike'
const BMC = {
  text: 'Buy me a book.',
  slug: 'oumike',
  color: '#FFDD00',
  emoji: '\u{1F4D6}',
  font: 'Cookie',
  fontColor: '#000000',
  outlineColor: '#000000',
  coffeeColor: '#ffffff',
}

function BuyMeACoffee() {
  const [markup, setMarkup] = useState(null)

  useEffect(() => {
    let cancelled = false

    const render = () => {
      if (cancelled || typeof window.bmcBtnWidget !== 'function') return
      setMarkup(window.bmcBtnWidget(
        BMC.text, BMC.slug, BMC.color, BMC.emoji, BMC.font,
        BMC.fontColor, BMC.outlineColor, BMC.coffeeColor,
      ))
    }

    if (typeof window.bmcBtnWidget === 'function') {
      render()
      return () => { cancelled = true }
    }

    // Reused rather than re-added, so a remount does not stack script tags.
    let script = document.querySelector(`script[src="${BMC_SCRIPT}"]`)
    if (!script) {
      script = document.createElement('script')
      script.src = BMC_SCRIPT
      script.async = true
      document.body.appendChild(script)
    }
    script.addEventListener('load', render)

    return () => {
      cancelled = true
      script.removeEventListener('load', render)
    }
  }, [])

  // Until the script lands -- or if it never does, which is the case worth
  // designing for on a page someone may be reading offline -- the link is still
  // there and still works.
  return markup ? (
    <div className="footer-bmc" dangerouslySetInnerHTML={{ __html: markup }} />
  ) : (
    <a className="footer-bmc-link" href={BMC_URL} target="_blank" rel="noreferrer">
      {BMC.text}
    </a>
  )
}

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
        <BuyMeACoffee />
      </div>
    </footer>
  )
}
