import 'dotenv/config'
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { Hono } from 'hono'
import tags from './tags.js'
import { db } from '../db/database.js'
import { createPlaylist, createCollection, createArtist, createAlbum, cleanupFixtures } from '../test/fixtures.js'

after(cleanupFixtures)

const appWithUser = (user: any) => {
  const app = new Hono()
  app.use('*', async (c, next) => { if (user) c.set('user' as never, user as never); await next() })
  app.route('/tags', tags)
  return app
}
const admin = appWithUser({ id: 1, admin: true })
const post = (app: Hono, path: string, name: string) =>
  app.request(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })

const CREATORS = {
  playlist: createPlaylist,
  collection: createCollection,
  artist: createArtist,
  album: async (label: string) => createAlbum(label, (await createArtist(`${label}-artist`)).id),
}

for (const [kind, create] of Object.entries(CREATORS)) {

  test(`POST/GET/DELETE /tags/${kind}/:id round-trips a tag`, async () => {
    const entity = await create(`tags-route-${kind}`)
    // upsertTag slugifies the name, stripping the fixture prefix's leading
    // underscores, so cleanupFixtures can't find this tag — delete it here.
    const tagName = `zzz-tags-route-${kind}-${process.pid}-${Date.now()}`
    after(() => db.deleteFrom('tags').where('name', '=', tagName).execute())

    const added = await post(admin, `/tags/${kind}/${entity.id}`, tagName)
    assert.equal(added.status, 200)
    assert.deepEqual((await added.json() as any[]).map((t) => t.name), [tagName])

    // Adding the same tag twice is a no-op, not a duplicate row or an error.
    assert.equal((await post(admin, `/tags/${kind}/${entity.id}`, tagName)).status, 200)
    const listed = await (await admin.request(`/tags/${kind}/${entity.id}`)).json() as any[]
    assert.equal(listed.length, 1)

    const removed = await admin.request(`/tags/${kind}/${entity.id}/${tagName}`, { method: 'DELETE' })
    assert.equal(removed.status, 200)
    assert.deepEqual(await (await admin.request(`/tags/${kind}/${entity.id}`)).json(), [])
  })

  test(`POST /tags/${kind}/:id requires an admin`, async () => {
    const entity = await create(`tags-route-${kind}-nonadmin`)
    const res = await post(appWithUser({ id: 1, admin: false }), `/tags/${kind}/${entity.id}`, 'whatever')
    assert.equal(res.status, 403)
  })
}

test('GET /tags/:kind/:id rejects a non-numeric id instead of erroring in the DB', async () => {
  assert.equal((await admin.request('/tags/album/abc')).status, 400)
})
