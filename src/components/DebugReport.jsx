import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CAPTURE_DURATION_MS,
  DIAGNOSTIC_COMMANDS,
  appendCapture,
  buildDebugIssue,
  buildDebugReport,
  redactDiagnostics,
} from '../debugReport.js'

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function delay(ms) {
  return new Promise(resolve => window.setTimeout(resolve, ms))
}

function formatUsbId(value) {
  return typeof value === 'number'
    ? `0x${value.toString(16).padStart(4, '0')}`
    : 'unknown'
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const fallback = document.createElement('textarea')
  fallback.value = value
  fallback.style.position = 'fixed'
  fallback.style.opacity = '0'
  document.body.appendChild(fallback)
  fallback.select()
  const copied = document.execCommand('copy')
  fallback.remove()
  if (!copied) throw new Error('Clipboard access failed')
}

export default function DebugReport({ device, version, supported }) {
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState('idle')
  const [status, setStatus] = useState('')
  const [diagnostics, setDiagnostics] = useState('')
  const [summary, setSummary] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [capturedAt, setCapturedAt] = useState('')
  const [reportContext, setReportContext] = useState(null)

  const panelRef = useRef(null)
  const closeRef = useRef(null)
  const returnRef = useRef(null)
  const readerRef = useRef(null)
  const portRef = useRef(null)
  const timeoutRef = useRef(null)
  const intervalRef = useRef(null)
  const captureRef = useRef('')
  const stopRequestedRef = useRef(false)
  const phaseRef = useRef('idle')
  const sessionRef = useRef(0)
  const mountedRef = useRef(true)

  const secure = typeof window === 'undefined' || window.isSecureContext
  const available = supported && secure
  const busy = phase === 'requesting' || phase === 'capturing'
  const context = reportContext ?? { device, version }

  const reportOptions = useMemo(() => ({
    device: context.device,
    version: context.version,
    summary,
    diagnostics,
    capturedAt,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  }), [context.device, context.version, summary, diagnostics, capturedAt])

  const issue = useMemo(
    () => buildDebugIssue(reportOptions),
    [reportOptions]
  )

  function clearTimers() {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    if (intervalRef.current) window.clearInterval(intervalRef.current)
    timeoutRef.current = null
    intervalRef.current = null
  }

  function changePhase(nextPhase) {
    phaseRef.current = nextPhase
    if (mountedRef.current) setPhase(nextPhase)
  }

  function appendLocalOutput(value, paint = true) {
    captureRef.current = appendCapture(captureRef.current, value)
    if (paint && mountedRef.current) setDiagnostics(redactDiagnostics(captureRef.current))
  }

  function stopCapture() {
    if (phaseRef.current !== 'capturing') return
    stopRequestedRef.current = true
    setStatus('Stopping capture...')
    readerRef.current?.cancel().catch(() => {})
  }

  async function beginCapture(event) {
    const session = ++sessionRef.current
    if (!panelRef.current?.contains(document.activeElement)) {
      returnRef.current = event?.currentTarget ?? document.activeElement
    }
    setOpen(true)
    changePhase('requesting')
    setStatus('Select the connected Camillia device in the browser prompt.')
    setDiagnostics('')
    setSecondsLeft(Math.ceil(CAPTURE_DURATION_MS / 1000))
    setCapturedAt(new Date().toISOString())
    setReportContext({ device, version })
    captureRef.current = ''
    stopRequestedRef.current = false

    if (!available) {
      changePhase('error')
      setStatus(supported
        ? 'Web Serial requires HTTPS or localhost.'
        : 'Web Serial is not available in this browser.')
      return
    }

    let port = null
    let reader = null
    let readError = null
    try {
      port = await navigator.serial.requestPort()
      if (session !== sessionRef.current) return
      portRef.current = port
      await port.open({ baudRate: 115200, bufferSize: 65_536 })
      if (session !== sessionRef.current) return
      if (!port.readable || !port.writable) {
        throw new Error('The serial port did not expose readable and writable streams.')
      }

      const info = port.getInfo?.() ?? {}
      appendLocalOutput([
        '[web-report] Connected at 115200 baud',
        `[web-report] USB VID=${formatUsbId(info.usbVendorId)} PID=${formatUsbId(info.usbProductId)}`,
        '[web-report] Requesting read-only diagnostic snapshots',
        '',
      ].join('\n'))

      changePhase('capturing')
      setStatus('Capturing diagnostics. For boot failures, press RESET on the device now.')

      reader = port.readable.getReader()
      readerRef.current = reader
      const decoder = new TextDecoder()
      let lastPaint = 0
      const readPromise = (async () => {
        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          if (!value?.length) continue
          const now = Date.now()
          appendLocalOutput(decoder.decode(value, { stream: true }), now - lastPaint >= 150)
          if (now - lastPaint >= 150) lastPaint = now
        }
        appendLocalOutput(decoder.decode(), false)
      })().catch(error => { readError = error })

      const deadline = Date.now() + CAPTURE_DURATION_MS
      timeoutRef.current = window.setTimeout(() => {
        readerRef.current?.cancel().catch(() => {})
      }, CAPTURE_DURATION_MS)
      intervalRef.current = window.setInterval(() => {
        setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)))
      }, 1_000)

      await delay(800)
      const writer = port.writable.getWriter()
      try {
        await writer.write(new TextEncoder().encode('\n'))
        for (const command of DIAGNOSTIC_COMMANDS) {
          if (stopRequestedRef.current) break
          appendLocalOutput(`\n> ${command}\n`)
          await writer.write(new TextEncoder().encode(`${command}\n`))
          await delay(180)
        }
      } finally {
        writer.releaseLock()
      }

      await readPromise
      if (readError && !stopRequestedRef.current) throw readError
      if (session !== sessionRef.current) return

      const redacted = redactDiagnostics(captureRef.current)
      setDiagnostics(redacted || '[No serial output was received]')
      changePhase('ready')
      setStatus(stopRequestedRef.current
        ? 'Capture stopped. Review and edit the report below.'
        : 'Capture complete. Review and edit the report before opening GitHub.')
    } catch (error) {
      if (session !== sessionRef.current || !mountedRef.current) return
      const cancelled = error?.name === 'NotFoundError'
      const portBusy = error?.name === 'InvalidStateError'
        || /already open|failed to open|in use/i.test(error?.message ?? '')
      const partial = redactDiagnostics(captureRef.current)
      if (!cancelled && !portBusy && partial && phaseRef.current === 'capturing') {
        setDiagnostics(partial)
        changePhase('ready')
        setStatus(`Capture ended early: ${error?.message || 'Device disconnected'}. Review the partial report below.`)
        return
      }
      changePhase('error')
      setStatus(cancelled
        ? 'No device was selected.'
        : portBusy
          ? 'The serial port is busy. Close the flash dialog, disconnect other serial monitors, and retry.'
          : `Could not capture diagnostics: ${error?.message || 'Unknown serial error'}`)
    } finally {
      clearTimers()
      if (mountedRef.current && session === sessionRef.current) setSecondsLeft(0)
      if (reader) {
        try { reader.releaseLock() } catch {}
      }
      readerRef.current = null
      if (port) {
        try { await port.close() } catch {}
      }
      portRef.current = null
    }
  }

  async function copyReport() {
    try {
      await copyText(buildDebugReport(reportOptions))
      setStatus('Full sanitized report copied to the clipboard.')
    } catch (error) {
      setStatus(`Could not copy the report: ${error?.message || 'Clipboard unavailable'}`)
    }
  }

  function handleIssueClick() {
    if (!issue.diagnosticsTruncated) {
      setStatus('GitHub opened with the prefilled report. Review it, then submit the issue.')
      return
    }

    copyText(buildDebugReport(reportOptions))
      .then(() => setStatus('GitHub opened with compact diagnostics; the full report was copied for optional pasting.'))
      .catch(() => setStatus('GitHub opened with compact diagnostics. Use Copy full report if more output is needed.'))
  }

  function requestClose() {
    if (phaseRef.current === 'capturing') {
      stopCapture()
      return
    }
    if (phaseRef.current === 'requesting') return
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const onKeyDown = event => {
      if (event.key === 'Escape') {
        event.preventDefault()
        requestClose()
        return
      }
      if (event.key !== 'Tab') return
      const items = panelRef.current?.querySelectorAll(FOCUSABLE)
      if (!items?.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      returnRef.current?.focus?.()
    }
  }, [open])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      sessionRef.current += 1
      clearTimers()
      stopRequestedRef.current = true
      readerRef.current?.cancel().catch(() => {})
      portRef.current?.close().catch(() => {})
    }
  }, [])

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={beginCapture}
        disabled={!available || busy}
        title={!supported
          ? 'Web Serial requires Chrome, Edge, Opera, or Brave on desktop'
          : !secure
            ? 'Web Serial requires HTTPS or localhost'
            : 'Read sanitized serial diagnostics and prepare a GitHub issue'}
      >
        Debug &amp; report
      </button>

      {open && (
        <div
          className="debug-report-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="debug-report-title"
          onClick={requestClose}
        >
          <div
            className="debug-report-panel"
            ref={panelRef}
            onClick={event => event.stopPropagation()}
          >
            <div className="debug-report-head">
              <div>
                <p className="eyebrow">Serial diagnostics</p>
                <h3 id="debug-report-title">Debug &amp; report</h3>
              </div>
              <button
                type="button"
                ref={closeRef}
                className="debug-report-close"
                onClick={requestClose}
                disabled={phase === 'requesting'}
              >
                Close
              </button>
            </div>

            <div className={`debug-report-status debug-report-status-${phase}`} role="status">
              <span className="debug-report-status-dot" aria-hidden="true" />
              <span>{status}</span>
              {phase === 'capturing' && <strong aria-hidden="true">{secondsLeft}s</strong>}
            </div>

            {phase === 'capturing' && (
              <div className="debug-report-capture-actions">
                <button type="button" className="flasher-row-btn" onClick={stopCapture}>
                  Stop capture
                </button>
              </div>
            )}

            {(phase === 'capturing' || phase === 'ready') && (
              <>
                <label className="debug-report-field">
                  <span>What happened?</span>
                  <textarea
                    value={summary}
                    onChange={event => setSummary(event.target.value)}
                    placeholder="Describe what you expected and what the device did instead."
                    rows={3}
                  />
                </label>

                <label className="debug-report-field debug-report-output-field">
                  <span>Sanitized serial output</span>
                  <textarea
                    value={diagnostics}
                    onChange={event => setDiagnostics(event.target.value)}
                    readOnly={phase === 'capturing'}
                    spellCheck="false"
                    rows={14}
                  />
                </label>

                <p className="debug-report-privacy">
                  SSIDs, likely secrets, network addresses, node IDs, and coordinates are redacted
                  automatically. Review the output before submitting it.
                </p>
              </>
            )}

            <div className="debug-report-actions">
              {phase === 'error' && (
                <button type="button" className="btn" onClick={beginCapture}>
                  Try again
                </button>
              )}
              {phase === 'ready' && (
                <>
                  <button type="button" className="flasher-row-btn" onClick={beginCapture}>
                    Recapture
                  </button>
                  <button type="button" className="flasher-row-btn" onClick={copyReport}>
                    Copy full report
                  </button>
                  {summary.trim() ? (
                    <a
                      className="btn"
                      href={issue.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={handleIssueClick}
                    >
                      Create GitHub issue
                    </a>
                  ) : (
                    <button type="button" className="btn" disabled>
                      Create GitHub issue
                    </button>
                  )}
                </>
              )}
            </div>

            {phase === 'ready' && !summary.trim() && (
              <p className="browser-note">Add a short problem description to enable the GitHub issue.</p>
            )}
            {phase === 'ready' && (
              <p className="browser-note">
                GitHub opens a prefilled issue for final review and submission. No GitHub credentials
                are sent to this site.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}