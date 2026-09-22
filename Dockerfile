# --- Build stage ---
#
# --platform=$BUILDPLATFORM pins this stage to the machine doing the building,
# not the machine being built for. That is what makes a multi-arch image cheap
# here: `npm ci` and `vite build` run once, natively on the runner, instead of
# once per target under QEMU — and their output is static JS and CSS, identical
# whatever the target architecture.
#
# Only the serve stage below is materialised per architecture, and it has no RUN
# at all (two COPYs and a HEALTHCHECK), so nothing is ever emulated.
FROM --platform=$BUILDPLATFORM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src

ARG VITE_BASE_PATH=/
ENV VITE_BASE_PATH=${VITE_BASE_PATH}

RUN npm run build

# --- Serve stage ---
FROM nginx:1.27-alpine

# Web Serial requires a secure context. Nginx serves over http here; the
# expectation is to terminate TLS at a reverse proxy (or run on localhost,
# which the browser treats as secure).
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
