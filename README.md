# camillia-mt-web

Information site and browser-based firmware flasher for
[Camillia-MT](https://github.com/oumike/camillia-mt) — Meshtastic-compatible
mesh radio firmware for ESP32-S3 handheld LoRa devices.

The site mirrors the firmware's 12 hand-tuned UI themes (each with a dark and
light mode), lets you switch the page theme to preview them, and ships a
[esp-web-tools](https://esphome.github.io/esp-web-tools/)-backed flasher that
writes firmware directly from the browser over USB.

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

A multi-stage `Dockerfile` builds the SPA with Node 20 and serves the result
with nginx.

```bash
docker build -t camillia-mt-web .
docker run --rm -p 8080:80 camillia-mt-web
```

Or with compose:

```bash
docker compose up --build
```

By default, compose builds with `VITE_BASE_PATH=/camillia/`, so open
<http://localhost:8080/camillia/>.

To build for a different base path:

```bash
VITE_BASE_PATH=/your-path/ docker compose up --build
```

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

## Updating the firmware version

Bump the constant in [`src/firmware.js`](src/firmware.js):

```js
export const FIRMWARE_VERSION = 'vX.Y.Z'
```

The manifest for every device is generated from this single value at runtime,
pointing at the matching `oumike/camillia-mt` GitHub release assets.

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
Dockerfile           node build → nginx serve
nginx.conf           SPA fallback + asset caching
docker-compose.yml   convenience target
```

## License

GPLv3, matching the upstream firmware.
