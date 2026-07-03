import { Hono } from 'hono'
import { searchService } from '../services/searchService.js'

const search = new Hono()

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'will', 'with',
])

function filterQuery(q: string): string {
  return q
    .replace(/[^\w\s]/g, '')
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w && !STOP_WORDS.has(w))
    .join(' ')
}

// GET /search?q=query
search.get('/', async (c) => {
  const query = c.req.query('q') ?? ''
  if (query.length < 3) {
    return c.json({ artists: [], albums: [], tracks: [], playlists: [], count: 0 })
  }

  const filteredQ = filterQuery(query)
  if (filteredQ.length < 3) {
    return c.json({ artists: [], albums: [], tracks: [], playlists: [], count: 0 })
  }

  const likeParam = `%${query}%`

  const searchRows = await searchService.runUnionSearch(likeParam, filteredQ)

  // Group ids by type, preserving order and deduplicating (keep first/highest-score occurrence)
  const grouped: Record<string, number[]> = {}
  for (const row of searchRows) {
    if (!grouped[row.model_type]) grouped[row.model_type] = []
    if (!grouped[row.model_type].includes(row.id)) {
      grouped[row.model_type].push(row.id)
    }
  }

  const [albums, artists, playlists, tracks] = await Promise.all([
    searchService.fetchAlbumsByIds(grouped['Album'] ?? []),
    searchService.fetchArtistsWithCounts(grouped['Artist'] ?? []),
    searchService.fetchByIds('playlists', grouped['Playlist'] ?? []),
    searchService.fetchTracksByIds(grouped['Track'] ?? [], c),
  ])

  return c.json({ artists, albums, tracks, playlists, count: 0 })
})

export default search
