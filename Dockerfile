# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src

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
