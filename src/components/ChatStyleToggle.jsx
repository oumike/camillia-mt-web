import { withBase } from '../basePath'

// The firmware's four chat styles (Config -> Chat Style), in its own order.
// Classic is the default on every board but the T-Deck Pro.
export const CHAT_STYLES = [
  { id: 'classic', label: 'Classic' },
  { id: 'bubbles', label: 'Bubbles' },
  { id: 'outline', label: 'Outline' },
  { id: 'irc',     label: 'IRC' },
]

export const DEFAULT_CHAT_STYLE = 'classic'

export function chatShot(style, name) {
  return withBase(`/screenshots/${style}/${name}.png`)
}

export default function ChatStyleToggle({ style, onChange, size }) {
  return (
    <div className={size === 'sm' ? 'mode-toggle mode-toggle-sm' : 'mode-toggle'}
         role="group" aria-label="Chat style">
      {CHAT_STYLES.map(s => (
        <button key={s.id} type="button" aria-pressed={style === s.id}
                onClick={() => onChange(s.id)}>{s.label}</button>
      ))}
    </div>
  )
}
