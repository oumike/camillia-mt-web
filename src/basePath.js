const BASE_PATH = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')

export function withBase(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${BASE_PATH}${normalizedPath}`
}