// Parsing and URL building for external_links rows. Pure functions only.

export type LinkEntityType = 'album' | 'artist'

export interface ParsedLink {
  source: string
  kind: string
  external_id: string
  url: string
}

export const LINK_SOURCES = ['discogs', 'wikidata', 'bandcamp', 'allmusic', 'other'] as const

const DISCOGS_KINDS: Record<string, string> = { release: 'release', master: 'master', artist: 'artist' }

function discogsUrl(kind: string, id: string): string {
  return `https://www.discogs.com/${kind}/${id}`
}

// Accepts a pasted URL, or for Discogs a bare id with `hint` supplying the
// source/kind. Returns null when the input cannot be understood.
export function parseExternalLink(input: string, hint?: { source?: string; kind?: string }): ParsedLink | null {
  const raw = input.trim()
  if (!raw) return null

  if (/^\d+$/.test(raw)) {
    if (hint?.source === 'discogs' && hint.kind && DISCOGS_KINDS[hint.kind]) {
      return { source: 'discogs', kind: hint.kind, external_id: raw, url: discogsUrl(hint.kind, raw) }
    }
    return null
  }

  let u: URL
  try {
    u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
  } catch {
    return null
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
  const host = u.hostname.toLowerCase().replace(/^www\./, '')

  if (host === 'discogs.com') {
    // /release/123-Title, /master/456-Title, /artist/789-Name, optionally /en/ locale prefix
    const m = u.pathname.match(/\/(release|master|artist)\/(\d+)/)
    if (!m) return null
    return { source: 'discogs', kind: m[1], external_id: m[2], url: discogsUrl(m[1], m[2]) }
  }

  if (host === 'wikidata.org') {
    const m = u.pathname.match(/\/(?:wiki|entity)\/(Q\d+)/i)
    if (!m) return null
    const id = m[1].toUpperCase()
    return { source: 'wikidata', kind: 'entity', external_id: id, url: `https://www.wikidata.org/wiki/${id}` }
  }

  const clean = `${u.protocol}//${u.host}${u.pathname}${u.search}`
  if (host === 'bandcamp.com' || host.endsWith('.bandcamp.com')) {
    return { source: 'bandcamp', kind: 'page', external_id: clean, url: clean }
  }
  if (host === 'allmusic.com') {
    return { source: 'allmusic', kind: 'page', external_id: clean, url: clean }
  }
  return { source: 'other', kind: 'page', external_id: clean, url: clean }
}
