import { Hono } from 'hono'
import { db } from '../db/database.js'
import type { Variables } from '../types.js'

const collections = new Hono<{ Variables: Variables }>()

function buildAlbum(a: any) {
  return {
    id: a.id,
    title: a.title,
    image_path: a.image_path,
    release_year: a.release_year,
    artist: { id: a.artist_id, name: a.artist_name },
  }
}

// GET /collections
collections.get('/', async (c) => {
  const rows = await db.selectFrom('collections').selectAll().orderBy('name', 'asc').execute()
  return c.json(rows)
})

// GET /collection/:id
collections.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  const collection = await db.selectFrom('collections').selectAll().where('id', '=', id).executeTakeFirst()
  if (!collection) return c.json({ error: 'Not found' }, 404)

  const caRows = await db
    .selectFrom('collection_albums')
    .select(['album_id', 'order'])
    .where('collection_id', '=', id)
    .orderBy('order', 'asc')
    .execute()

  const albumIds = caRows.map((r) => r.album_id)
  const albums = albumIds.length
    ? (await db
        .selectFrom('albums')
        .innerJoin('artists', 'artists.id', 'albums.artist_id')
        .select([
          'albums.id', 'albums.title', 'albums.image_path', 'albums.release_year',
          'artists.id as artist_id', 'artists.name as artist_name',
        ])
        .where('albums.id', 'in', albumIds)
        .execute()).map(buildAlbum)
    : []

  // Preserve order from collection_albums
  const byId = new Map(albums.map((a) => [a.id, a]))
  const orderedAlbums = albumIds.map((id) => byId.get(id)).filter(Boolean)

  return c.json({ collection, albums: orderedAlbums })
})

// POST /collections
collections.post('/', async (c) => {
  const { name } = await c.req.json()
  if (!name?.trim()) return c.json({ error: 'Name is required' }, 400)

  const result = await db
    .insertInto('collections')
    .values({ name: name.trim(), created_at: new Date(), updated_at: new Date() })
    .returningAll()
    .executeTakeFirst()

  return c.json(result, 201)
})

// PUT /collection/:id
collections.put('/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  const { name, image_path } = await c.req.json()

  await db.updateTable('collections').set({ name, image_path }).where('id', '=', id).execute()
  return c.json({ success: true })
})

// POST /collection/:id/albums
collections.post('/:id/albums', async (c) => {
  const collectionId = parseInt(c.req.param('id'))
  const { album_id } = await c.req.json()

  const maxOrderResult = await db
    .selectFrom('collection_albums')
    .select(db.fn.max('order').as('max_order'))
    .where('collection_id', '=', collectionId)
    .executeTakeFirst()

  const nextOrder = (maxOrderResult?.max_order ?? 0) + 1

  await db
    .insertInto('collection_albums')
    .values({ collection_id: collectionId, album_id, order: nextOrder })
    .onConflict((oc) => oc.columns(['collection_id', 'album_id']).doNothing())
    .execute()

  await db.updateTable('collections').set({ updated_at: new Date() }).where('id', '=', collectionId).execute()
  return c.json({ success: true })
})

// DELETE /collection/:id/albums/:albumId
collections.delete('/:id/albums/:albumId', async (c) => {
  const collectionId = parseInt(c.req.param('id'))
  const albumId = parseInt(c.req.param('albumId'))

  await db
    .deleteFrom('collection_albums')
    .where('collection_id', '=', collectionId)
    .where('album_id', '=', albumId)
    .execute()

  return c.json({ success: true })
})

// PATCH /collection/:id/albums/reorder
collections.patch('/:id/albums/reorder', async (c) => {
  const collectionId = parseInt(c.req.param('id'))
  const { album_orders } = await c.req.json() // [{ album_id, order }]

  for (const { album_id, order } of album_orders) {
    await db
      .updateTable('collection_albums')
      .set({ order })
      .where('collection_id', '=', collectionId)
      .where('album_id', '=', album_id)
      .execute()
  }

  return c.json({ success: true })
})

export default collections
