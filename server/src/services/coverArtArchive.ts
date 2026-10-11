// server/src/services/coverArtArchive.ts

import { db } from '../db/database.js'
import fs from 'fs'
import path from 'path'
import { createSmallVersion } from './imageResize.js'
import { errorLogService } from './errorLogService.js'

const CAA_BASE = 'https://coverartarchive.org'
const USER_AGENT = 'Bemused/1.0 (https://patf.net)'

interface CAAImage {
  id: string
  types: string[]
  front: boolean
  thumbnails: Record<string, string>
  image: string
}

// 'release-group' is what Overtone shows: a release often has no art of its
// own while its release group (any edition) does.
export type CAAEntity = 'release' | 'release-group'

async function fetchCAAImages(mbid: string, entity: CAAEntity = 'release'): Promise<CAAImage[]> {
  const res = await fetch(`${CAA_BASE}/${entity}/${mbid}`, {
    headers: { 'User-Agent': USER_AGENT }
  })
  if (res.status === 404) return []
  if (!res.ok) throw new Error(`CAA error ${res.status} for ${mbid}`)
  const data = await res.json() as { images: CAAImage[] }
  return data.images ?? []
}

// Lightweight existence check for ranking release candidates (see
// musicbrainz.ts's lookupAlbumMBID) — a candidate with confirmed cover art
// is preferred over one without. Treats errors as "no cover art" rather
// than throwing, since this is a soft preference signal, not a requirement.
export async function hasCoverArt(mbid: string): Promise<boolean> {
  try {
    const images = await fetchCAAImages(mbid)
    return images.length > 0
  } catch {
    return false
  }
}

function selectBestImageUrl(image: CAAImage): string | null {
  // Prefer large thumbnails in order of quality
  const candidates = [
    image.thumbnails['1200'],
    image.thumbnails['large'],   // ~500px
    image.image,                  // original
  ].filter(Boolean)
  return candidates[0] ?? null
}

// The worker kicks off one MBID lookup (and so one art fetch) per uploaded
// track, and they overlap. Run fetches for the same album one at a time so the
// "already attached?" check below sees the previous fetch's insert.
const albumFetchQueue = new Map<number, Promise<unknown>>()

export function fetchAlbumArtFromCAA(
  albumId: number,
  mbid: string,
  imagesDir: string,
  entity: CAAEntity = 'release'
): Promise<boolean> {
  const previous = albumFetchQueue.get(albumId) ?? Promise.resolve()
  const run = previous.catch(() => {}).then(() => fetchAlbumArt(albumId, mbid, imagesDir, entity))
  albumFetchQueue.set(albumId, run)
  run.catch(() => {}).finally(() => {
    if (albumFetchQueue.get(albumId) === run) albumFetchQueue.delete(albumId)
  })
  return run
}

async function fetchAlbumArt(
  albumId: number,
  mbid: string,
  imagesDir: string,
  entity: CAAEntity
): Promise<boolean> {
  let images: CAAImage[]
  try {
    images = await fetchCAAImages(mbid, entity)
  } catch (err) {
    console.warn(`  ⚠️  CAA fetch failed for album ${albumId}: ${(err as Error).message}`)
    errorLogService.record({ source: 'cover_art_archive', message: (err as Error).message, context: `fetch for album ${albumId}` })
    return false
  }

  if (images.length === 0) {
    console.log(`  ℹ️  No CAA images for album ${albumId} (${mbid})`)
    // Record that we checked so we don't re-query on future runs. Concurrent
    // per-track lookups for the same album can race here — ON CONFLICT keeps
    // it idempotent (see migration 033_dedupe_not_found_images).
    await db
      .insertInto('images')
      .values({ album_id: albumId, is_primary: false, source: 'cover_art_archive', status: 'not_found' })
      .onConflict(oc => oc
        .columns(['album_id', 'source'])
        .where('status', '=', 'not_found')
        .where('album_id', 'is not', null)
        .doNothing()
      )
      .execute()
    return false
  }

  // Prefer 'Front' type images, fall back to any image
  const frontImages = images.filter(img => img.types?.includes('Front') || img.front)
  const best = frontImages[0] ?? images[0]
  const url = selectBestImageUrl(best)

  if (!url) return false

  // Download the image
  const ext = url.split('.').pop()?.split('?')[0] ?? 'jpg'
  const filename = `album_${albumId}_caa_${best.id}.${ext}`

  // The filename encodes the CAA image id, so an existing row with it means this
  // exact image is already attached - don't download or record it again.
  const alreadyAttached = await db
    .selectFrom('images')
    .innerJoin('media_files', (join) =>
      join.onRef('media_files.entity_id', '=', 'images.id').on('media_files.entity_type', '=', 'image')
    )
    .select('images.id')
    .where('images.album_id', '=', albumId)
    .where('images.status', '=', 'active')
    .where('media_files.absolute_path', '=', filename)
    .executeTakeFirst()
  if (alreadyAttached) return true

  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
    if (!res.ok) throw new Error(`Download failed: ${res.status}`)
    const buffer = Buffer.from(await res.arrayBuffer())

    const dir = path.join(imagesDir, 'albums')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, filename), buffer)
    await createSmallVersion(path.join(dir, filename))

    // Set as primary if the album has no existing primary image
    const existingPrimary = await db
      .selectFrom('images')
      .select('id')
      .where('album_id', '=', albumId)
      .where('is_primary', '=', true)
      .executeTakeFirst()
    const isPrimary = !existingPrimary

    const image = await db
      .insertInto('images')
      .values({ album_id: albumId, is_primary: isPrimary, source: 'cover_art_archive', status: 'active' })
      .returningAll()
      .executeTakeFirstOrThrow()

    await db
      .insertInto('media_files')
      .values({
        entity_type: 'image',
        entity_id: image.id,
        discriminator: 'image',
        absolute_path: filename,
        name: filename,
        file_type: 'image',
        created_at: new Date(),
        updated_at: new Date(),
      })
      .execute()

    if (isPrimary) {
      await db.updateTable('albums').set({ image_path: filename, updated_at: new Date() }).where('id', '=', albumId).execute()
      console.log(`  ✅ CAA image saved and set as primary for album ${albumId}: ${filename}`)
    } else {
      console.log(`  ✅ CAA image saved for album ${albumId}: ${filename}`)
    }
    return true
  } catch (err) {
    console.warn(`  ⚠️  CAA download failed for album ${albumId}: ${(err as Error).message}`)
    errorLogService.record({ source: 'cover_art_archive', message: (err as Error).message, context: `download for album ${albumId}` })
    return false
  }
}
