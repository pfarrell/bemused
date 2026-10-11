import 'dotenv/config'
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { Hono } from 'hono'
import { externalLinksAdmin, externalLinksRead } from './externalLinks.js'
import { db } from '../db/database.js'
import { reassignExternalLinks, deleteExternalLinksFor } from '../services/entityDeleteService.js'

const app = new Hono()
app.route('/admin', externalLinksAdmin)
app.route('/external-links', externalLinksRead)

// Ids high enough not to collide with real rows; the entity-exists check is
// satisfied by a real album, so look one up.
let albumId: number
const FROM = 2_000_000_001
const TO = 2_000_000_002

after(async () => {
  await db.deleteFrom('external_links').where('entity_id', 'in', [albumId, FROM, TO]).execute()
})

const post = (id: number, body: object) =>
  app.request(`/admin/external-links/album/${id}`, { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } })

test('add, list, dedupe, delete', async () => {
  const album = await db.selectFrom('albums').select('id').limit(1).executeTakeFirstOrThrow()
  albumId = album.id

  const r1 = await post(albumId, { input: 'https://www.discogs.com/release/777777-Foo' })
  assert.equal(r1.status, 201)
  await post(albumId, { input: '777777', source: 'discogs', kind: 'release' })
  const list = await (await app.request(`/external-links/album/${albumId}`)).json() as any[]
  const mine = list.filter((l) => l.external_id === '777777')
  assert.equal(mine.length, 1)
  assert.equal(mine[0].url, 'https://www.discogs.com/release/777777')

  const del = await app.request(`/admin/external-links/${mine[0].id}`, { method: 'DELETE' })
  assert.equal(del.status, 200)
  const after = await (await app.request(`/external-links/album/${albumId}`)).json() as any[]
  assert.equal(after.filter((l) => l.external_id === '777777').length, 0)
})

test('rejects bad input and unknown entities', async () => {
  assert.equal((await post(albumId, { input: 'not a link' })).status, 400)
  assert.equal((await post(2_000_000_999, { input: 'https://www.discogs.com/release/1' })).status, 404)
  assert.equal((await app.request('/external-links/track/1')).status, 400)
})

test('reassign moves links and drops ones the target has; delete removes', async () => {
  const row = (entity_id: number, external_id: string) =>
    ({ entity_type: 'album' as const, entity_id, source: 'discogs', kind: 'release', external_id, url: `https://www.discogs.com/release/${external_id}` })
  await db.insertInto('external_links').values([row(FROM, '1'), row(FROM, '2'), row(TO, '1')]).execute()
  await db.transaction().execute((trx) => reassignExternalLinks('album', FROM, TO, trx))
  const rows = await db.selectFrom('external_links').select(['entity_id', 'external_id']).where('entity_id', 'in', [FROM, TO]).execute()
  assert.deepEqual(rows.filter((r) => r.entity_id === FROM), [])
  assert.deepEqual(rows.map((r) => r.external_id).sort(), ['1', '2'])
  await db.transaction().execute((trx) => deleteExternalLinksFor('album', [TO], trx))
  assert.equal((await db.selectFrom('external_links').select('id').where('entity_id', '=', TO).execute()).length, 0)
})
