import 'dotenv/config'
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { Hono } from 'hono'
import { createImageDownloadRoutes } from './imageDownloadRoutes.js'
import { createPlaylist, createCollection, cleanupFixtures } from '../test/fixtures.js'

after(cleanupFixtures)

const appFor = (kind: 'playlist' | 'collection', user: any) => {
  const app = new Hono()
  app.use('*', async (c, next) => { if (user) c.set('user' as never, user as never); await next() })
  app.route('/', createImageDownloadRoutes(kind))
  return app
}
const post = (app: Hono, path: string, body: object) =>
  app.request(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

for (const [kind, create] of [['playlist', createPlaylist], ['collection', createCollection]] as const) {
  test(`POST /:id/image for a ${kind} requires both image_url and image_name`, async () => {
    const entity = await create(`image-route-${kind}-missing`)
    const res = await post(appFor(kind, { id: 1, admin: true }), `/${entity.id}/image`, { image_url: 'https://example.com/a.jpg' })
    assert.equal(res.status, 400)
  })

  test(`POST /:id/image for a ${kind} refuses a non-owner`, async () => {
    const entity = await create(`image-route-${kind}-nonowner`)
    const res = await post(appFor(kind, { id: 999999999, admin: false }), `/${entity.id}/image`, { image_url: 'https://example.com/a.jpg', image_name: 'a.jpg' })
    assert.equal(res.status, 403)
  })

  test(`POST /:id/image for an unknown ${kind} is a 404`, async () => {
    const res = await post(appFor(kind, { id: 1, admin: true }), '/999999999/image', { image_url: 'https://example.com/a.jpg', image_name: 'a.jpg' })
    assert.equal(res.status, 404)
  })
}
