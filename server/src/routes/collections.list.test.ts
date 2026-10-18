import 'dotenv/config'
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { Hono } from 'hono'
import collectionsRouter from './collections.js'
import { createArtist, createAlbum, createCollection, createTag, createProfile, tagAlbum, tagCollection, addAlbumToCollection, cleanupFixtures } from '../test/fixtures.js'

after(cleanupFixtures)

// GET /collections has no requireAuth of its own — index.ts's protectedApp
// wrapper gates it — so a bare mount is enough here.
const app = () => {
  const a = new Hono()
  a.route('/', collectionsRouter)
  return a
}

test('GET /?profileId= lists collections tagged directly or containing a matching album', async () => {
  const tag = await createTag('list-co-tag')
  const profile = await createProfile('list-co-profile', [tag.id])
  const artist = await createArtist('list-co-artist')
  const taggedAlbum = await createAlbum('list-co-tagged-album', artist.id)
  const plainAlbum = await createAlbum('list-co-plain-album', artist.id)
  await tagAlbum(taggedAlbum.id, tag.id)

  const direct = await createCollection('list-co-direct')
  await tagCollection(direct.id, tag.id)
  const viaAlbum = await createCollection('list-co-viaalbum')
  await addAlbumToCollection(viaAlbum.id, plainAlbum.id)
  await addAlbumToCollection(viaAlbum.id, taggedAlbum.id)
  const noMatch = await createCollection('list-co-nomatch')
  await addAlbumToCollection(noMatch.id, plainAlbum.id)

  const res = await app().request(`/?profileId=${profile.id}`)
  assert.equal(res.status, 200)
  const body = await res.json() as any[]
  assert.ok(body.some((c) => c.id === direct.id))
  // Visibility only — a matching collection still reports all of its albums.
  assert.equal(body.find((c) => c.id === viaAlbum.id)?.album_count, 2)
  assert.equal(body.some((c) => c.id === noMatch.id), false)

  const unfiltered = await (await app().request('/')).json() as any[]
  assert.ok(unfiltered.some((c) => c.id === noMatch.id))
})

test('GET /?profileId= for an unknown or garbage profile lists nothing', async () => {
  await createCollection('list-co-unknown')
  for (const profileId of ['999999999', 'abc']) {
    const res = await app().request(`/?profileId=${profileId}`)
    assert.equal(res.status, 200)
    assert.deepEqual(await res.json(), [])
  }
})
