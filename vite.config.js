import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy /firmware/* to the GitHub release CDN. esp-web-tools fetches the .bin
// from the browser, but GitHub release assets do not serve CORS headers, so we
// hand the request off to Vite (dev) / nginx (prod) which can fetch server-side.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/firmware/': {
        target: 'https://github.com',
        changeOrigin: true,
        followRedirects: true,
        rewrite: (path) => path.replace(/^\/firmware\//, '/oumike/camillia-mt/releases/download/'),
      },
    },
  },
})
