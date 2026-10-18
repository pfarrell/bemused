import 'dotenv/config'
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { Hono } from 'hono'
import playlistsRouter from './playlists.js'
import { requireAuth } from '../middleware/auth.js'
import { createPlaylist, createTag, createProfile, tagPlaylist, cleanupFixtures } from '../test/fixtures.js'

after(cleanupFixtures)

const appWithUser = (user: any = { id: 1 }) => {
  const app = new Hono()
  app.use('*', async (c, next) => { if (user) c.set('user' as never, user as never); await next() })
  app.use('*', requireAuth)
  app.route('/', playlistsRouter)
  return app
}

test('GET / without profileId lists untagged playlists', async () => {
  const playlist = await createPlaylist('list-unfiltered')
  const body = await (await appWithUser().request('/')).json() as any[]
  assert.ok(body.some((p) => p.id === playlist.id))
})

test('GET /?profileId= lists only playlists carrying one of the profile\'s tags', async () => {
  const tag = await createTag('list-pl-tag')
  const profile = await createProfile('list-pl-profile', [tag.id])
  const tagged = await createPlaylist('list-pl-tagged')
  const untagged = await createPlaylist('list-pl-untagged')
  await tagPlaylist(tagged.id, tag.id)

  const res = await appWithUser().request(`/?profileId=${profile.id}`)
  assert.equal(res.status, 200)
  const body = await res.json() as any[]
  const found = body.find((p) => p.id === tagged.id)
  assert.ok(found)
  assert.equal(found.track_count, 0)
  assert.equal(body.some((p) => p.id === untagged.id), false)
})

test('GET /?profileId= for an unknown or garbage profile lists nothing', async () => {
  await createPlaylist('list-pl-unknown')
  for (const profileId of ['999999999', 'abc']) {
    const res = await appWithUser().request(`/?profileId=${profileId}`)
    assert.equal(res.status, 200)
    assert.deepEqual(await res.json(), [])
  }
})
