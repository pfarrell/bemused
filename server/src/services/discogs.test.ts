import 'dotenv/config'
import { test, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import sharp from 'sharp'
import { db } from '../db/database.js'
import { searchDiscogs, fetchAlbumArtFromDiscogs } from './discogs.js'

const realFetch = globalThis.fetch
let calls: { url: string; headers: any }[] = []
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'discogs-test-'))
let albumId: number | undefined

beforeEach(() => { process.env.DISCOGS_TOKEN = 'tok'; calls = [] })
after(async () => {
  globalThis.fetch = realFetch
  if (albumId) {
    const imgs = await db.selectFrom('images').select('id').where('album_id', '=', albumId).execute()
    if (imgs.length) await db.deleteFrom('media_files').where('entity_type', '=', 'image').where('entity_id', 'in', imgs.map((i) => i.id)).execute()
    await db.deleteFrom('images').where('album_id', '=', albumId).execute()
    await db.updateTable('albums').set({ image_path: null }).where('id', '=', albumId).execute()
  }
  fs.rmSync(tmp, { recursive: true, force: true })
})

test('searchDiscogs sends the token and maps results', async () => {
  globalThis.fetch = (async (url: any, init: any) => {
    calls.push({ url: String(url), headers: init.headers })
    return new Response(JSON.stringify({ results: [
      { id: 5, type: 'master', title: 'A - B', year: '1995', country: 'US', label: ['Time Life'], format: ['CD', 'Compilation'], thumb: 't.jpg' },
    ] }))
  }) as any
  const out = await searchDiscogs('release', { artist: 'A', title: 'B' })
  assert.equal(out[0].url, 'https://www.discogs.com/release/5')
  assert.equal(out[0].label, 'Time Life')
  assert.equal(out[0].format, 'CD, Compilation')
  assert.match(calls[0].url, /release_title=B/)
  assert.match(calls[0].url, /artist=A/)
  assert.equal(calls[0].headers.Authorization, 'Discogs token=tok')
})

test('searchDiscogs throws without a token', async () => {
  delete process.env.DISCOGS_TOKEN
  await assert.rejects(searchDiscogs('release', { q: 'x' }), /not configured/)
})

test('fetchAlbumArtFromDiscogs saves one image, primary only when none, and is idempotent', async () => {
  const album = await db.selectFrom('albums').select('id').where('image_path', 'is', null).limit(1).executeTakeFirstOrThrow()
  albumId = album.id
  await db.deleteFrom('images').where('album_id', '=', albumId).execute()
  const jpeg = await sharp({ create: { width: 20, height: 20, channels: 3, background: '#888' } }).jpeg().toBuffer()

  let downloads = 0
  globalThis.fetch = (async (url: any) => {
    if (String(url).includes('/masters/')) {
      return new Response(JSON.stringify({ images: [{ type: 'secondary', uri: 'https://i.discogs.com/b.jpg' }, { type: 'primary', uri: 'https://i.discogs.com/a.jpg' }] }))
    }
    downloads++
    assert.match(String(url), /a\.jpg/)
    return new Response(new Uint8Array(jpeg))
  }) as any

  assert.equal(await fetchAlbumArtFromDiscogs(albumId, 'master', '321', tmp), true)
  assert.equal(await fetchAlbumArtFromDiscogs(albumId, 'master', '321', tmp), true)
  assert.equal(downloads, 1)
  const rows = await db.selectFrom('images').selectAll().where('album_id', '=', albumId).execute()
  assert.equal(rows.length, 1)
  assert.equal(rows[0].source, 'discogs')
  assert.equal(rows[0].is_primary, true)
  const a = await db.selectFrom('albums').select('image_path').where('id', '=', albumId).executeTakeFirstOrThrow()
  assert.equal(a.image_path, 'album_' + albumId + '_discogs_master_321.jpg')
})
