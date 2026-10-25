# camillia-mt-web

Information site and browser-based firmware flasher for
[Camillia-MT](https://github.com/oumike/camillia-mt) — Meshtastic-compatible
mesh radio firmware for thirteen ESP32-S3 and ESP32-P4 handheld LoRa devices.

The site mirrors the firmware's 13 hand-tuned UI themes (each with a dark and
light mode), lets you switch the page theme to preview them, and ships a
[esp-web-tools](https://esphome.github.io/esp-web-tools/)-backed flasher that
writes firmware directly from the browser over USB.

The hardware picker includes separate LilyGo T-Display P4 AMOLED profiles for
the SX1262 and LR2021 radio variants. Their ESP32-P4 application images are
available through the same browser flasher and download flow as the ESP32-S3
targets; the board's ESP32-C6 wireless companion firmware remains a separate
release asset and must be provisioned independently.

## Develop

```bash
npm install
npm run dev
```

Then open <http://localhost:5173>.

## Build

```bash
npm run build       # outputs static files to dist/
npm run preview     # serves the built site on :4173
```

## Run as a container

Releases publish an image to GHCR, so nothing needs building to run the site:

```bash
docker run --rm -p 8080:80 ghcr.io/oumike/camillia-mt-web:latest
```

The image is published for **`linux/amd64` and `linux/arm64`**, so it runs on a
Raspberry Pi as well as an x86 box.

The published image is **baked for the `/camillia/` subpath** — Vite rewrites
every asset URL at build time, so this is not runtime-tunable. Open
<http://localhost:8080/camillia/>, not the root.

On the server, with the repo checked out:

```bash
./update-container.sh                 # pull :latest and recreate
./update-container.sh --tag 1.0.1     # roll back to an exact version
```

`update-container.sh --git-pull` refreshes the checkout first, which is only
needed when `docker-compose.yml` or the script itself has changed.

### Building it yourself

`docker-compose.yml` is pull-only on purpose. Local builds use an overlay that
tags the result `camillia-mt-web:local`, so a local build can never overwrite
the published image under the same name:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

To build for a different base path:

```bash
VITE_BASE_PATH=/your-path/ docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

> `nginx.conf` is baked into the image. Editing it on the server has no effect
> — an nginx change needs a commit and a release.

### Reverse proxy at www.sumat.org/camillia

If `www.sumat.org` is served by nginx and the container runs on the same host
at `127.0.0.1:8080`:

```nginx
location = /camillia {
  return 301 /camillia/;
}

location /camillia/ {
  proxy_pass http://127.0.0.1:8080;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

Then reload nginx and browse <https://www.sumat.org/camillia/>.

### A note on Web Serial

The in-browser flasher uses the Web Serial API, which only runs in secure
contexts. That means:

- `http://localhost` works (browsers treat localhost as secure).
- Any other host requires HTTPS — terminate TLS at a reverse proxy in front
  of the container.
- Web Serial is only implemented in Chromium-based browsers (Chrome, Edge,
  Opera, Brave) on desktop. Firefox and Safari are not supported. The page
  detects this and offers a `.bin` download fallback.

### Debug and report

The firmware flasher also includes **Debug & report**. It opens a separate
115200-baud Web Serial session, requests the firmware's read-only health
snapshots, and captures ambient output for ten seconds. The report deliberately
does not request chat content or configuration exports.

Before showing the result, the browser redacts likely credentials, SSIDs,
network addresses, node IDs, and coordinates. The user can review and edit both
the problem description and serial output, copy the full report, or open a
prefilled issue for `oumike/camillia-mt` assigned to `oumike`.

This remains a static site: it never asks for or stores GitHub credentials.
GitHub handles authentication, final review, and submission on its own new-issue
page. If the serial output is too large for a reliable issue URL, the prefilled
issue contains a compact excerpt and the full sanitized report is copied for
optional pasting.

### Flash and Customize

**Flash and Customize**, beside the Flash button, pre-configures an install. A
plain **Flash** never asks about customization. It can set:

- the radio preset;
- a boot logo, shown on the splash card in place of the Camillia flower;
- the channel list, which replaces every channel on the device. Each channel
  has a name, a key, position sharing, and MQTT uplink and downlink;
- the answers on-device setup asks for: long and short name, region, role and
  Wi-Fi. Names left blank are made from the node ID ("Camillia 1a2b" /
  "1a2b"), so one set of choices suits any number of devices. The Wi-Fi
  password is never stored in the browser.

**Start from** fills these in from a community setup: about 40 meshes in the
US, the Americas and Asia-Pacific, and Europe, with their published radio
preset, frequency slot, region and channel keys. ChiMesh and MichMesh also
bring the community's logo (rendered from its own SVG into `public/logos/`).
Each profile lists the settings it recommends that the flasher cannot set yet,
such as MQTT servers and the hop limit. Meshes on a frequency that is not a
slot (MeshOregon, YYCMesh, Spain) are not listed.

**Frequency slot** pins the preset to a slot, numbered as in the Meshtastic
apps, for meshes that are not on the preset's own (Freq51 runs Medium Fast on
slot 51). The device stores it as custom modem settings. It needs firmware
6.1.0 or later, whose `cfg caps` lists `slot`.

**Continue to flash** keeps the choices in `localStorage` and opens the
installer. When that flash finishes the installer dialog closes itself and the
choices are applied automatically over the port the installer already had, so
there is no second prompt; progress shows under the buttons, with **Retry** if
it fails. Applying opens a 115200-baud Web Serial session and speaks
camillia-mt's `cfg` CLI; see [`src/customize.js`](src/customize.js):

- `cfg caps` reports what the device supports, its channel slots and the size of
  its logo area.
- Changes are staged with `cfg set preset`, `cfg channels clear` + `cfg set
  channel`, `cfg logo begin`/`data`/`end`, and `cfg set region`/`role`/
  `longname`/`shortname`/`ssid`/`wifipass`. The logo is sent as hex chunks
  with a CRC-32 check.
- `cfg commit` writes everything at once.

The logo is resized to the device's logo area, drawn over the card colour and
shrunk until it fits the 8 KB limit in NVS. On a fresh install with the setup
answers, commit finishes setup on the device and reboots it ready to use;
without them the device holds the settings until on-device setup completes. On
an existing install it saves them and reboots. Firmware without the `cfg` commands, or without a feature, is
detected and reported.

The chat server's page has the same dialog (`PRODUCTS.cs` in `customize.js`):
camillia-chat-server speaks the same `cfg` CLI and reports `product=cs` in
`cfg caps`. There the channel list holds 20 channels without the position and
MQTT flags, setup has no role, and the choices are saved apart from
Camillia-MT's (`camillia.customize.cs`). A commit on the server always clears
its stored message history before it restarts. It cannot use a broker that
needs TLS.

## Updating the firmware version

`FIRMWARE_VERSION` in [`src/firmware.js`](src/firmware.js) is **not** where the
version list comes from. The flasher fetches every release from the GitHub API
at page load (`releaseCatalog()`); the constant is only the fallback shown when
that call fails — rate limit, offline, API outage.

It no longer needs hand-editing: the release workflow syncs it from
`oumike/camillia-mt`'s latest stable release on every release. To pin a specific
value instead, set the `firmware_version` input when dispatching the release.

## Releasing

Releases are cut by hand from the Actions tab — never on a push or a tag — the
same way the firmware repo does it.

1. **Actions → Release → Run workflow**, from `main`.
2. Leave `version` blank to bump the patch of the latest tag, or type an exact
   `X.Y.Z`. The first release seeds `1.0.0`.
3. Tick `dry_run` to build and smoke-test without publishing anything.

The job, in order: syncs `FIRMWARE_VERSION`, bumps `package.json`, builds and
**smoke-tests the image**, and only then pushes the image, the commit, the tag
and the GitHub Release. `:latest` moves last, so the server can never pull a
version whose release does not exist yet.

Then, on the server:

```bash
./update-container.sh
```

### One-time setup

The first release creates `ghcr.io/oumike/camillia-mt-web` as a **private**
package, and `docker compose pull` will fail with a 401 that reads like a bad
image name. After release `1.0.0`:

- [ ] Package settings → **Change visibility → Public**
- [ ] Confirm **Inherit access from repository** links it to this repo

(Or keep it private and run `docker login ghcr.io` on the server with a
`read:packages` token.)

### Rolling back

```bash
./update-container.sh --tag 1.0.1
```

Every published version stays in GHCR; the prune step only removes dangling
images, so old tags remain as rollback targets.

## How the theme port works

The firmware's theme system lives in
[`camillia-mt/src/main_lvgl.cpp`](https://github.com/oumike/camillia-mt/blob/main/src/main_lvgl.cpp)
— a table of four anchor `rgb565` values per theme/mode, expanded into a full
palette at runtime by `applyUiThemePalette()`. [`src/themes.js`](src/themes.js)
ports both the anchor table and the derivation logic to JavaScript, so the
browser shows the same colors the device draws.

The favicon is a faithful SVG port of `drawCamelliaMark()` from the same file
(petal counts, orbit radii, and colors all preserved).

## Layout

```
src/
  App.jsx            top-level shell + theme persistence
  themes.js          rgb565 palettes + applyUiThemePalette() port
  devices.js         hardware target metadata (shared by Devices + Flasher)
  firmware.js        version constant + manifest generator
  components/        Hero, Features, Devices, ThemePicker, Flasher, Docs, …
public/
  favicon.svg        camellia mark from the firmware splash
Dockerfile             node build → nginx serve
nginx.conf             SPA fallback, asset caching, firmware proxies
docker-compose.yml     server: pull the published image
docker-compose.dev.yml overlay: build locally as camillia-mt-web:local
update-container.sh    server-side deploy (pull → recreate)
.github/workflows/
  build.yml            CI: build site + image, shellcheck, smoke test
  release.yml          manual release: publish to GHCR, tag, create Release
```

## License

GPLv3, matching the upstream firmware.
