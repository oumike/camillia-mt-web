import { useEffect, useState } from 'react'

// A browser rendering of the firmware's channel view, using the same palette
// variables the device derives at runtime. Everything inside is sized in `em`
// so the whole screen scales from one font-size on the root element.

// The device's real top-level key legend, as it appears on hardware.
export const KEY_LEGEND = [
  { key: 'C', rest: 'FG' },
  { key: 'Ch', rest: 'an' },
  { key: 'D', rest: 'M' },
  { key: 'N', rest: 'odes' },
  { key: 'L', rest: 'ive' },
  { key: 'A', rest: 'ct' },
]

const FEED = [
  { from: 'Ghost0', body: 'Anyone up on LongFast tonight?' },
  { from: 'RiBl', body: 'Here. 2 hops out, SNR 6.5.' },
  { from: 'you', body: 'Hello MI mesh' },
  { from: '9730', body: 'Copy that — clear signal.' },
  { from: 'Ghost0', body: 'Visiting from AZ.' },
  { from: 'OT_R', body: 'Welcome in. Repeater is up on the ridge.' },
  { from: 'you', body: 'Traceroute looks clean.' },
  { from: 'NWIV', body: 'Good night, mesh.' },
  { from: 'RiJa', body: 'Position ack, 4.1 km NE.' },
  { from: 'you', body: 'Copy. Signing off.' },
]

const WINDOW = 6
const TICK_MS = 2800

function clock(offsetMin) {
  const d = new Date(Date.now() + offsetMin * 60000)
  return String(d.getHours()).padStart(2, '0') + ':' +
         String(d.getMinutes()).padStart(2, '0')
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

// Rows carry a stable seq key and a timestamp fixed at the moment they arrive,
// so React reuses the surviving rows and only the newest one animates in.
function initialRows() {
  return Array.from({ length: WINDOW }, (_, i) => ({
    ...FEED[i],
    seq: i,
    at: clock(-(WINDOW - i) * 3),
  }))
}

export default function DeviceScreen({ channel = 'LongFast', live = false }) {
  const [rows, setRows] = useState(initialRows)
  const [now, setNow] = useState(() => clock(0))

  useEffect(() => {
    const id = setInterval(() => setNow(clock(0)), 15000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!live || prefersReducedMotion()) return undefined
    const id = setInterval(() => {
      setRows(prev => {
        const seq = prev[prev.length - 1].seq + 1
        return [...prev.slice(1), { ...FEED[seq % FEED.length], seq, at: clock(0) }]
      })
    }, TICK_MS)
    return () => clearInterval(id)
  }, [live])

  return (
    <div className="screen" role="img"
         aria-label={`Camillia channel view on ${channel}, showing recent mesh messages`}>
      <div className="screen-status">
        <span className="screen-chan">{channel}</span>
        <span className="screen-time">{now}</span>
        <span className="screen-batt"><i style={{ width: '87%' }} /></span>
      </div>

      <div className="screen-log">
        {rows.map(r => (
          <div key={r.seq}
               className={r.from === 'you' ? 'screen-msg screen-msg-own' : 'screen-msg'}>
            <div className="screen-meta">
              <span className="screen-ts">{r.at}</span>
              <span className="screen-from">{r.from === 'you' ? 'MI-Base' : r.from}</span>
            </div>
            <div className="screen-body">{r.body}</div>
          </div>
        ))}
      </div>

      <div className="screen-keys" aria-hidden="true">
        {KEY_LEGEND.map(k => (
          <span key={k.key} className="screen-key">
            (<b>{k.key}</b>){k.rest}
          </span>
        ))}
      </div>
    </div>
  )
}
