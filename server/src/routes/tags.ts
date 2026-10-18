import { Hono } from 'hono'
import { sql } from 'kysely'
import { db } from '../db/database.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import type { Variables } from '../types.js'
import { countsService } from '../services/countsService.js'

const tags = new Hono<{ Variables: Variables }>()

function slugifyTag(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

async function upsertTag(name: string): Promise<number> {
  const slug = slugifyTag(name)
  if (!slug) throw new Error('Invalid tag name')

  const existing = await db
    .selectFrom('tags')
    .select('id')
    .where('name', '=', slug)
    .executeTakeFirst()

  if (existing) return existing.id

  const created = await db
    .insertInto('tags')
    .values({ name: slug })
    .returning('id')
    .executeTakeFirst()

  return created!.id
}

// GET /tags — list all tags alphabetically (for autocomplete)
tags.get('/', requireAuth, async (c) => {
  const rows = await db
    .selectFrom('tags')
    .select(['id', 'name'])
    .orderBy('name', 'asc')
    .execute()
  return c.json(rows)
})

// GET /tags/album/:id — tags on a specific album
tags.get('/album/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  const rows = await db
    .selectFrom('albums_tags')
    .innerJoin('tags', 'tags.id', 'albums_tags.tag_id')
    .select(['tags.id', 'tags.name'])
    .where('albums_tags.album_id', '=', id)
    .orderBy('tags.name', 'asc')
    .execute()
  return c.json(rows)
})

// GET /tags/artist/:id — tags on a specific artist
tags.get('/artist/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  const rows = await db
    .selectFrom('artists_tags')
    .innerJoin('tags', 'tags.id', 'artists_tags.tag_id')
    .select(['tags.id', 'tags.name'])
    .where('artists_tags.artist_id', '=', id)
    .orderBy('tags.name', 'asc')
    .execute()
  return c.json(rows)
})

// GET /tags/:name/content — all albums and artists with this tag (browse page)
tags.get('/:name/content', requireAuth, async (c) => {
  const tagName = slugifyTag(c.req.param('name'))

  const tag = await db
    .selectFrom('tags')
    .select(['id', 'name'])
    .where('name', '=', tagName)
    .executeTakeFirst()

  if (!tag) return c.json({ tag: tagName, albums: [], artists: [] })

  const albums = await db
    .selectFrom('albums_tags')
    .innerJoin('albums', 'albums.id', 'albums_tags.album_id')
    .innerJoin('artists', 'artists.id', 'albums.artist_id')
    .select([
      'albums.id',
      'albums.title',
      'albums.image_path',
      'albums.release_year',
      'artists.id as artist_id',
      'artists.name as artist_name',
    ])
    .where('albums_tags.tag_id', '=', tag.id)
    .orderBy('artists.name', 'asc')
    .execute()

  const artists = await db
    .selectFrom('artists_tags')
    .innerJoin('artists', 'artists.id', 'artists_tags.artist_id')
    .select(['artists.id', 'artists.name', 'artists.image_path'])
    .where('artists_tags.tag_id', '=', tag.id)
    .orderBy('artists.name', 'asc')
    .execute()

  const trackCounts = await countsService.trackCountsByAlbumIds(albums.map((a) => a.id))
  const albumCounts = await countsService.albumCountsByArtistIds(artists.map((a) => a.id))

  return c.json({
    tag: tag.name,
    albums: albums.map((a) => ({
      id: a.id,
      title: a.title,
      image_path: a.image_path,
      release_year: a.release_year,
      artist: { id: a.artist_id, name: a.artist_name },
      track_count: trackCounts.get(a.id) ?? 0,
    })),
    artists: artists.map((a) => ({
      ...a,
      album_count: albumCounts.get(a.id) ?? 0,
    })),
  })
})

// POST /tags/album/:id — add tag to album
tags.post('/album/:id', requireAdmin, async (c) => {
  const albumId = parseInt(c.req.param('id'))
  const body = await c.req.json()
  if (!body.name) return c.json({ error: 'name required' }, 400)

  const tagId = await upsertTag(body.name)

  const existing = await db
    .selectFrom('albums_tags')
    .select('id')
    .where('album_id', '=', albumId)
    .where('tag_id', '=', tagId)
    .executeTakeFirst()

  if (!existing) {
    await db.insertInto('albums_tags').values({ album_id: albumId, tag_id: tagId }).execute()
  }

  const updatedTags = await db
    .selectFrom('albums_tags')
    .innerJoin('tags', 'tags.id', 'albums_tags.tag_id')
    .select(['tags.id', 'tags.name'])
    .where('albums_tags.album_id', '=', albumId)
    .orderBy('tags.name', 'asc')
    .execute()

  return c.json(updatedTags)
})

// DELETE /tags/album/:id/:tagName — remove tag from album
tags.delete('/album/:id/:tagName', requireAdmin, async (c) => {
  const albumId = parseInt(c.req.param('id'))
  const tagName = slugifyTag(c.req.param('tagName'))

  const tag = await db
    .selectFrom('tags')
    .select('id')
    .where('name', '=', tagName)
    .executeTakeFirst()

  if (!tag) return c.json({ error: 'Tag not found' }, 404)

  await db
    .deleteFrom('albums_tags')
    .where('album_id', '=', albumId)
    .where('tag_id', '=', tag.id)
    .execute()

  return c.json({ ok: true })
})

// POST /tags/artist/:id — add tag to artist
tags.post('/artist/:id', requireAdmin, async (c) => {
  const artistId = parseInt(c.req.param('id'))
  const body = await c.req.json()
  if (!body.name) return c.json({ error: 'name required' }, 400)

  const tagId = await upsertTag(body.name)

  const existing = await db
    .selectFrom('artists_tags')
    .select('id')
    .where('artist_id', '=', artistId)
    .where('tag_id', '=', tagId)
    .executeTakeFirst()

  if (!existing) {
    await db.insertInto('artists_tags').values({ artist_id: artistId, tag_id: tagId }).execute()
  }

  const updatedTags = await db
    .selectFrom('artists_tags')
    .innerJoin('tags', 'tags.id', 'artists_tags.tag_id')
    .select(['tags.id', 'tags.name'])
    .where('artists_tags.artist_id', '=', artistId)
    .orderBy('tags.name', 'asc')
    .execute()

  return c.json(updatedTags)
})

// DELETE /tags/artist/:id/:tagName — remove tag from artist
tags.delete('/artist/:id/:tagName', requireAdmin, async (c) => {
  const artistId = parseInt(c.req.param('id'))
  const tagName = slugifyTag(c.req.param('tagName'))

  const tag = await db
    .selectFrom('tags')
    .select('id')
    .where('name', '=', tagName)
    .executeTakeFirst()

  if (!tag) return c.json({ error: 'Tag not found' }, 404)

  await db
    .deleteFrom('artists_tags')
    .where('artist_id', '=', artistId)
    .where('tag_id', '=', tag.id)
    .execute()

  return c.json({ ok: true })
})

// Playlist and collection tags — same contract as the album/artist routes
// above (GET is public, writes are admin-only), but one implementation for
// both since the two join tables share a shape. These tags are what a profile
// filter matches playlists/collections against (see profileFilter.ts).
const OWNER_TAG_TABLES = {
  playlist: { table: 'playlists_tags', column: 'playlist_id' },
  collection: { table: 'collections_tags', column: 'collection_id' },
} as const

for (const [kind, { table, column }] of Object.entries(OWNER_TAG_TABLES)) {
  const listTags = async (ownerId: number) => {
    const { rows } = await sql<{ id: number; name: string }>`
      SELECT tags.id, tags.name FROM ${sql.table(table)} jt
      INNER JOIN tags ON tags.id = jt.tag_id
      WHERE ${sql.ref(`jt.${column}`)} = ${ownerId}
      ORDER BY tags.name ASC
    `.execute(db)
    return rows
  }

  // GET /tags/playlist/:id, /tags/collection/:id
  tags.get(`/${kind}/:id`, async (c) => {
    const ownerId = parseInt(c.req.param('id'))
    if (Number.isNaN(ownerId)) return c.json({ error: 'Invalid id' }, 400)
    return c.json(await listTags(ownerId))
  })

  // POST /tags/playlist/:id, /tags/collection/:id — add a tag (by name)
  tags.post(`/${kind}/:id`, requireAdmin, async (c) => {
    const ownerId = parseInt(c.req.param('id'))
    if (Number.isNaN(ownerId)) return c.json({ error: 'Invalid id' }, 400)
    const body = await c.req.json()
    if (!body.name) return c.json({ error: 'name required' }, 400)

    const tagId = await upsertTag(body.name)
    await sql`
      INSERT INTO ${sql.table(table)} (${sql.ref(column)}, tag_id) VALUES (${ownerId}, ${tagId})
      ON CONFLICT (${sql.ref(column)}, tag_id) DO NOTHING
    `.execute(db)

    return c.json(await listTags(ownerId))
  })

  // DELETE /tags/playlist/:id/:tagName, /tags/collection/:id/:tagName
  tags.delete(`/${kind}/:id/:tagName`, requireAdmin, async (c) => {
    const ownerId = parseInt(c.req.param('id'))
    if (Number.isNaN(ownerId)) return c.json({ error: 'Invalid id' }, 400)
    const tagName = slugifyTag(c.req.param('tagName'))

    const tag = await db.selectFrom('tags').select('id').where('name', '=', tagName).executeTakeFirst()
    if (!tag) return c.json({ error: 'Tag not found' }, 404)

    await sql`
      DELETE FROM ${sql.table(table)} WHERE ${sql.ref(column)} = ${ownerId} AND tag_id = ${tag.id}
    `.execute(db)

    return c.json({ ok: true })
  })
}

export default tags
