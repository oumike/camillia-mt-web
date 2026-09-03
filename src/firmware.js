import { withBase } from './basePath'

// Configuration for the in-browser flasher. FIRMWARE_VERSION is the fallback
// used if the GitHub API call fails (rate limit, offline, etc.) — the live
// version list is fetched at page load via releaseCatalog().
export const FIRMWARE_VERSION = 'v2.5.0'
export const REPO = 'oumike/camillia-mt'

// Same-origin proxy path. Vite (dev) and nginx (prod) forward /firmware/<tag>/<file>
// to https://github.com/<repo>/releases/download/<tag>/<file>, adding CORS
// headers so esp-web-tools' fetch() can read the .bin. GitHub release-assets
// CDN itself does not send Access-Control-Allow-Origin.
export const PROXY_BASE = withBase('/firmware')

// platformio env name -> release asset slug (matches release.sh's env_out_name).
const ASSET_SLUG = {
  'tdeck': 'tdeck',
  'tdeck-pro': 'tdeck-pro',
  'tlora-pager-tft': 'tlora-pager-tft',
  'cardputer-cap': 'cardputer-cap',
  'heltec-v4': 'heltec',
  'heltec-v4-vertical': 'heltec-vertical',
  'mesh-deck': 'mesh-deck',
  'm9': 'm9',
  'wio-tracker-l2': 'wio-tracker-l2',
}

export function firmwareAssetName(env, version) {
  const slug = ASSET_SLUG[env]
  if (!slug) throw new Error(`No release asset mapping for env "${env}"`)
  return `camillia-mt-${slug}-${version}.bin`
}

export function firmwareUrl(env, version) {
  return `${PROXY_BASE}/${version}/${firmwareAssetName(env, version)}`
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

// Fetch all GitHub releases (paginated) and return an ordered catalog:
// [{ tag, assetNames, notes, url } ...], newest first. Drafts are skipped.
export async function releaseCatalog() {
  const perPage = 100
  const maxPages = 10
  const out = []

  for (let page = 1; page <= maxPages; page += 1) {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/releases?per_page=${perPage}&page=${page}`,
      {
        headers: { Accept: 'application/vnd.github+json' },
      }
    )
    if (!res.ok) throw new Error(`GitHub API ${res.status}`)
    const data = await res.json()
    if (!Array.isArray(data)) throw new Error('Unexpected releases response')

    for (const rel of data) {
      if (!rel || rel.draft || !rel.tag_name) continue
      const assetNames = Array.isArray(rel.assets)
        ? rel.assets
            .map(a => a?.name)
            .filter(Boolean)
        : []
      out.push({
        tag: rel.tag_name,
        assetNames,
        notes: rel.body ?? '',
        url: rel.html_url ?? '',
        // GitHub's own flag, not a guess from the tag text. release.sh --alpha
        // publishes with --prerelease, which is the same bit the device's
        // stable OTA route relies on to not see these builds.
        prerelease: !!rel.prerelease,
      })
    }

    if (data.length < perPage) break
  }

  if (!out.length) throw new Error('No release tags found')
  return out
}

// Releases that have a flashable asset for this env, newest first.
function releasesForEnv(catalog, env) {
  if (!Array.isArray(catalog)) return []
  return catalog.filter(rel => {
    if (!rel || !rel.tag || !Array.isArray(rel.assetNames)) return false
    return rel.assetNames.includes(firmwareAssetName(env, rel.tag))
  })
}

// Return version tags that have a flashable asset for this env.
export function versionsForEnv(catalog, env) {
  return releasesForEnv(catalog, env).map(rel => rel.tag)
}

// The same list split by channel, for a version picker that shows the two
// apart. Order within each group is preserved (newest first).
export function groupedVersionsForEnv(catalog, env) {
  const rels = releasesForEnv(catalog, env)
  return {
    stable: rels.filter(rel => !rel.prerelease).map(rel => rel.tag),
    alpha: rels.filter(rel => rel.prerelease).map(rel => rel.tag),
  }
}

// Backward-compatible helper for callers that still want a single latest tag.
export async function latestVersion() {
  const catalog = await releaseCatalog()
  const top = catalog[0]?.tag
  if (!top) throw new Error('No tag_name in release response')
  return top
}
