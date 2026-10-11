// Read route is mounted under the logged-in app (/external-links); write
// routes under /admin (behind requireAdmin), see index.ts.
import { Hono } from 'hono'
import { db } from '../db/database.js'
import { parseExternalLink, type LinkEntityType } from '../services/externalLinks.js'

function entityType(raw: string): LinkEntityType | null {
  return raw === 'album' || raw === 'artist' ? raw : null
}

async function listLinks(type: LinkEntityType, id: number) {
  return db
    .selectFrom('external_links')
    .select(['id', 'source', 'kind', 'external_id', 'url', 'matched_by'])
    .where('entity_type', '=', type)
    .where('entity_id', '=', id)
    .orderBy('source')
    .orderBy('kind')
    .orderBy('id')
    .execute()
}

export const externalLinksRead = new Hono()

externalLinksRead.get('/:type/:id', async (c) => {
  const type = entityType(c.req.param('type'))
  const id = parseInt(c.req.param('id'))
  if (!type || !Number.isInteger(id)) return c.json({ error: 'Invalid entity' }, 400)
  return c.json(await listLinks(type, id))
})

export const externalLinksAdmin = new Hono()

// POST /admin/external-links/:type/:id  { input, source?, kind? }
externalLinksAdmin.post('/external-links/:type/:id', async (c) => {
  const type = entityType(c.req.param('type'))
  const id = parseInt(c.req.param('id'))
  if (!type || !Number.isInteger(id)) return c.json({ error: 'Invalid entity' }, 400)

  const body = await c.req.json().catch(() => ({}))
  const input = typeof body.input === 'string' ? body.input : ''
  const parsed = parseExternalLink(input, { source: body.source, kind: body.kind })
  if (!parsed) {
    return c.json({ error: 'Could not understand that link. Paste a full URL (for a bare Discogs id, choose release, master or artist).' }, 400)
  }

  const table = type === 'album' ? 'albums' : 'artists'
  const exists = await db.selectFrom(table).select('id').where('id', '=', id).executeTakeFirst()
  if (!exists) return c.json({ error: `${type} not found` }, 404)

  await db
    .insertInto('external_links')
    .values({ entity_type: type, entity_id: id, ...parsed, matched_by: 'manual' })
    .onConflict((oc) => oc.columns(['entity_type', 'entity_id', 'source', 'kind', 'external_id']).doNothing())
    .execute()
  return c.json(await listLinks(type, id), 201)
})

// DELETE /admin/external-links/:linkId
externalLinksAdmin.delete('/external-links/:linkId', async (c) => {
  const linkId = parseInt(c.req.param('linkId'))
  if (!Number.isInteger(linkId)) return c.json({ error: 'Invalid id' }, 400)
  const res = await db.deleteFrom('external_links').where('id', '=', linkId).executeTakeFirst()
  if (Number(res.numDeletedRows) === 0) return c.json({ error: 'Not found' }, 404)
  return c.json({ success: true })
})
