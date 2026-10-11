// Mounted under /admin (behind requireAdmin), see admin/index.ts.
import { Hono } from 'hono'
import { db } from '../../db/database.js'
import { imagesDir } from '../../config/paths.js'
import {
  isDiscogsConfigured, searchDiscogs, fetchAlbumArtFromDiscogs, type DiscogsKind,
} from '../../services/discogs.js'

const router = new Hono()

const isVariousArtists = (name: string) => /^various( artists)?$/i.test(name.trim())

// GET /admin/discogs/search?entity=album|artist&id=123[&q=override]
// Builds the query from the entity itself; q replaces it when the automatic
// artist/title guess finds nothing.
router.get('/discogs/search', async (c) => {
  if (!isDiscogsConfigured()) return c.json({ error: 'DISCOGS_TOKEN is not set on the server' }, 503)
  const entity = c.req.query('entity')
  const id = parseInt(c.req.query('id') ?? '')
  const q = c.req.query('q')?.trim() || undefined
  if ((entity !== 'album' && entity !== 'artist') || !Number.isInteger(id)) {
    return c.json({ error: 'entity and id are required' }, 400)
  }

  try {
    let results
    if (entity === 'album') {
      const album = await db
        .selectFrom('albums')
        .innerJoin('artists', 'artists.id', 'albums.artist_id')
        .select(['albums.title', 'artists.name as artist_name'])
        .where('albums.id', '=', id)
        .executeTakeFirst()
      if (!album) return c.json({ error: 'Album not found' }, 404)
      const params = q
        ? { q }
        : { title: album.title, artist: isVariousArtists(album.artist_name) ? undefined : album.artist_name }
      const kinds: DiscogsKind[] = ['master', 'release']
      results = []
      for (const kind of kinds) results.push(...(await searchDiscogs(kind, params)))
    } else {
      const artist = await db.selectFrom('artists').select('name').where('id', '=', id).executeTakeFirst()
      if (!artist) return c.json({ error: 'Artist not found' }, 404)
      results = await searchDiscogs('artist', { artist: artist.name, q })
    }
    return c.json({ results })
  } catch (error) {
    console.error('Discogs search failed:', error)
    return c.json({ error: 'Discogs search failed' }, 502)
  }
})

// POST /admin/album/:id/discogs-cover { link_id } - download the cover of one
// of the album's linked Discogs releases/masters.
router.post('/album/:id/discogs-cover', async (c) => {
  if (!isDiscogsConfigured()) return c.json({ error: 'DISCOGS_TOKEN is not set on the server' }, 503)
  const id = parseInt(c.req.param('id'))
  const { link_id } = await c.req.json().catch(() => ({}))
  if (!Number.isInteger(id) || !Number.isInteger(link_id)) return c.json({ error: 'link_id is required' }, 400)

  const link = await db
    .selectFrom('external_links')
    .select(['source', 'kind', 'external_id'])
    .where('id', '=', link_id)
    .where('entity_type', '=', 'album')
    .where('entity_id', '=', id)
    .executeTakeFirst()
  if (!link || link.source !== 'discogs' || (link.kind !== 'release' && link.kind !== 'master')) {
    return c.json({ error: 'That is not a Discogs release or master link on this album' }, 400)
  }

  try {
    const found = await fetchAlbumArtFromDiscogs(id, link.kind, link.external_id, imagesDir())
    if (!found) return c.json({ error: 'Discogs has no images for that release' }, 404)
    const updated = await db.selectFrom('albums').select('image_path').where('id', '=', id).executeTakeFirst()
    return c.json({ success: true, image_path: updated?.image_path ?? null })
  } catch (error) {
    console.error('Discogs cover fetch failed:', error)
    return c.json({ error: 'Failed to fetch the Discogs cover (see the error log)' }, 502)
  }
})

export default router
