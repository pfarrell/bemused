import type { Context } from 'hono'

// Returns the base URL to use for stream URLs in track responses.
// In production, BEMUSED_PATH is set (e.g. https://patf.com/bemused) and nginx routes correctly.
// When the request came in via the LAN IP, stream URLs stay on the LAN instead of
// following BEMUSED_PATH back out to patf.com over the WAN — see
// docs/superpowers/specs/2026-07-03-lan-access-design.md.
// In dev, we need an absolute URL so the browser can reach the API port directly.
export function streamBase(c: Context): string {
  const host = (c.req.header('host') || '').split(':')[0]
  if (process.env.NODE_ENV === 'production' && host === '172.16.1.10') {
    return 'http://172.16.1.10/bemused'
  }
  const bemusedPath = process.env.BEMUSED_PATH ?? ''
  if (bemusedPath) return bemusedPath
  const port = process.env.PORT ?? '3939'
  return `http://localhost:${port}`
}
