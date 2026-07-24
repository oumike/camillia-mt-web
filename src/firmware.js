import { withBase } from './basePath'

// Configuration for the in-browser flasher. FIRMWARE_VERSION is the fallback
// used if the GitHub API call fails (rate limit, offline, etc.) — the live
// version is fetched at page load via latestVersion().
export const FIRMWARE_VERSION = 'v2.5.0'
export const REPO = 'oumike/camillia-mt'

// Same-origin proxy path. Vite (dev) and nginx (prod) forward /firmware/<tag>/<file>
// to https://github.com/<repo>/releases/download/<tag>/<file>, adding CORS
// headers so esp-web-tools' fetch() can read the .bin. GitHub release-assets
// CDN itself does not send Access-Control-Allow-Origin.
export const PROXY_BASE = withBase('/firmware')

// platformio env name -> release asset slug (matches .github/workflows/build.yml).
const ASSET_SLUG = {
  'tdeck': 'tdeck',
  'tlora-pager-tft': 'tlora-pager-tft',
  'cardputer-cap': 'cardputer-cap',
  'heltec-v4': 'heltec',
  'heltec-v4-vertical': 'heltec-vertical',
}

export function firmwareUrl(env, version) {
  const slug = ASSET_SLUG[env]
  if (!slug) throw new Error(`No release asset mapping for env "${env}"`)
  return `${PROXY_BASE}/${version}/camillia-mt-${slug}-${version}.bin`
}

// esp-web-tools manifest. flash.sh writes one bin at offset 0x0 for esp32s3,
// so the manifest mirrors that: one part, offset 0, chipFamily ESP32-S3. The
// part URL must be absolute — esp-web-tools calls `new URL(path)` without a
// base — so we resolve against window.location.origin (same-origin proxy).
export function manifestFor(device, version) {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return {
    name: `Camillia-MT (${device.name})`,
    version,
    new_install_prompt_erase: true,
    builds: [
      {
        chipFamily: 'ESP32-S3',
        parts: [
          { path: `${origin}${firmwareUrl(device.env, version)}`, offset: 0 },
        ],
      },
    ],
  }
}

// Encode the manifest as a data: URL so esp-web-install-button can fetch it
// without any lifecycle (blob URLs can be revoked before the button reads them).
export function manifestDataUrl(device, version) {
  const json = JSON.stringify(manifestFor(device, version))
  return `data:application/json;charset=utf-8,${encodeURIComponent(json)}`
}

// Ask GitHub for the latest release tag. Returns the tag string (e.g. "v2.5.1").
// api.github.com serves CORS headers, so this works from the browser. Throws
// on network errors / rate limit — callers should fall back to FIRMWARE_VERSION.
// GitHub's /releases/latest excludes prereleases, so this only returns stable.
export async function latestVersion() {
  const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
    headers: { Accept: 'application/vnd.github+json' },
  })
  if (!res.ok) throw new Error(`GitHub API ${res.status}`)
  const data = await res.json()
  if (!data.tag_name) throw new Error('No tag_name in release response')
  return data.tag_name
}
