// Returns the base URL to use for stream URLs in track responses.
// In production, BEMUSED_PATH is set (e.g. /bemused) and nginx routes correctly.
// In dev, we need an absolute URL so the browser can reach the API port directly.
export function streamBase(): string {
  const bemusedPath = process.env.BEMUSED_PATH ?? ''
  if (bemusedPath) return bemusedPath
  const port = process.env.PORT ?? '3939'
  return `http://localhost:${port}`
}
