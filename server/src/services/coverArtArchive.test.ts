import 'dotenv/config'
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import sharp from 'sharp'
import { db } from '../db/database.js'
import { createArtist, createAlbum, cleanupFixtures } from '../test/fixtures.js'
import { fetchAlbumArtFromCAA } from './coverArtArchive.js'

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'caa-test-'))
const realFetch = globalThis.fetch

after(async () => {
  globalThis.fetch = realFetch
  fs.rmSync(tmpDir, { recursive: true, force: true })
  await cleanupFixtures()
})

// Fake Cover Art Archive: the release JSON lists `imageId`, and every image
// download returns a tiny valid jpeg. Counts image downloads.
async function withFakeCaa(imageId: string, fn: (downloads: () => number) => Promise<void>) {
  const jpeg = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#c00' } }).jpeg().toBuffer()
  let downloads = 0
  globalThis.fetch = (async (url: string | URL | Request) => {
    const u = String(url)
    if (u.includes('coverartarchive.org/release/')) {
      return new Response(JSON.stringify({
        images: [{ id: imageId, types: ['Front'], front: true, thumbnails: { large: `https://img.example/${imageId}.jpg` }, image: `https://img.example/${imageId}.jpg` }],
      }), { status: 200 })
    }
    downloads++
    return new Response(new Uint8Array(jpeg), { status: 200 })
  }) as typeof fetch
  try {
    await fn(() => downloads)
  } finally {
    globalThis.fetch = realFetch
  }
}

const activeImages = (albumId: number) =>
  db.selectFrom('images').select(['id', 'is_primary']).where('album_id', '=', albumId).where('status', '=', 'active').execute()

test('regression: concurrent and repeated fetches of the same CAA image attach it once', async () => {
  const artist = await createArtist('caa-dedupe')
  const album = await createAlbum('caa-dedupe', artist.id)

  await withFakeCaa('111', async (downloads) => {
    // The worker fires one lookup per uploaded track, overlapping in time.
    const results = await Promise.all(Array.from({ length: 5 }, () => fetchAlbumArtFromCAA(album.id, 'mbid-x', tmpDir)))
    assert.ok(results.every(Boolean))
    await fetchAlbumArtFromCAA(album.id, 'mbid-x', tmpDir) // a later track's lookup

    const images = await activeImages(album.id)
    assert.equal(images.length, 1)
    assert.equal(images[0].is_primary, true)
    assert.equal(downloads(), 1)

    const files = await db.selectFrom('media_files').select('id').where('entity_type', '=', 'image').where('entity_id', '=', images[0].id).execute()
    assert.equal(files.length, 1)
  })
})

test('a different CAA image for the same album is still added', async () => {
  const artist = await createArtist('caa-second')
  const album = await createAlbum('caa-second', artist.id)

  await withFakeCaa('222', async () => { await fetchAlbumArtFromCAA(album.id, 'mbid-a', tmpDir) })
  await withFakeCaa('333', async () => { await fetchAlbumArtFromCAA(album.id, 'mbid-b', tmpDir) })

  const images = await activeImages(album.id)
  assert.equal(images.length, 2)
  assert.equal(images.filter(i => i.is_primary).length, 1)
})
