// server/src/services/discogs.ts
// Discogs API client (search + cover art). Needs DISCOGS_TOKEN (a personal
// access token); nothing here runs automatically, it backs the admin
// "Find on Discogs" / "Use Discogs cover" actions.
import fs from 'fs'
import path from 'path'
import { db } from '../db/database.js'
import { createSmallVersion } from './imageResize.js'
import { errorLogService } from './errorLogService.js'

const API = 'https://api.discogs.com'
const USER_AGENT = 'Bemused/1.0 (https://patf.net)'
// Authenticated limit is 60 requests/minute; stay a little under it.
const MIN_INTERVAL_MS = 1100

export type DiscogsKind = 'release' | 'master' | 'artist'

export interface DiscogsResult {
  id: number
  kind: DiscogsKind
  title: string
  year: string | null
  country: string | null
  label: string | null
  format: string | null
  thumb: string | null
  url: string
}

export function isDiscogsConfigured(): boolean {
  return !!process.env.DISCOGS_TOKEN
}

let nextSlot = 0
async function throttle(): Promise<void> {
  const now = Date.now()
  const wait = Math.max(0, nextSlot - now)
  nextSlot = Math.max(now, nextSlot) + MIN_INTERVAL_MS
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
}

function authHeaders(): Record<string, string> {
  return { 'User-Agent': USER_AGENT, Authorization: `Discogs token=${process.env.DISCOGS_TOKEN}` }
}

async function discogsGet<T>(pathAndQuery: string): Promise<T> {
  if (!isDiscogsConfigured()) throw new Error('DISCOGS_TOKEN is not configured')
  await throttle()
  const res = await fetch(`${API}${pathAndQuery}`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`Discogs error ${res.status} for ${pathAndQuery.split('?')[0]}`)
  return (await res.json()) as T
}

interface RawSearchResult {
  id: number
  type: string
  title: string
  year?: string
  country?: string
  label?: string[]
  format?: string[]
  thumb?: string
  uri?: string
}

export async function searchDiscogs(
  kind: DiscogsKind,
  params: { artist?: string; title?: string; q?: string },
): Promise<DiscogsResult[]> {
  const qs = new URLSearchParams({ type: kind, per_page: '10' })
  if (params.q) {
    qs.set('q', params.q)
  } else if (kind === 'artist') {
    if (params.artist) qs.set('q', params.artist)
  } else {
    if (params.artist) qs.set('artist', params.artist)
    if (params.title) qs.set('release_title', params.title)
  }
  const data = await discogsGet<{ results?: RawSearchResult[] }>(`/database/search?${qs}`)
  return (data.results ?? []).map((r) => ({
    id: r.id,
    kind,
    title: r.title,
    year: r.year ?? null,
    country: r.country ?? null,
    label: r.label?.[0] ?? null,
    format: r.format?.join(', ') ?? null,
    thumb: r.thumb || null,
    url: `https://www.discogs.com/${kind}/${r.id}`,
  }))
}

interface DiscogsImage {
  type: 'primary' | 'secondary'
  uri: string
}

// Saves the primary (else first) image of a Discogs release/master as an album
// image. Primary only when the album has none. Filenames encode the Discogs
// id, so repeating the action for the same release is a no-op.
export async function fetchAlbumArtFromDiscogs(
  albumId: number,
  kind: 'release' | 'master',
  discogsId: string,
  imagesDir: string,
): Promise<boolean> {
  let images: DiscogsImage[]
  try {
    const data = await discogsGet<{ images?: DiscogsImage[] }>(`/${kind}s/${discogsId}`)
    images = data.images ?? []
  } catch (err) {
    errorLogService.record({ source: 'discogs', message: (err as Error).message, context: `lookup for album ${albumId}` })
    throw err
  }
  const best = images.find((i) => i.type === 'primary') ?? images[0]
  if (!best?.uri) return false

  const ext = best.uri.split('.').pop()?.split('?')[0] ?? 'jpg'
  const filename = `album_${albumId}_discogs_${kind}_${discogsId}.${ext}`

  const alreadyAttached = await db
    .selectFrom('images')
    .innerJoin('media_files', (join) =>
      join.onRef('media_files.entity_id', '=', 'images.id').on('media_files.entity_type', '=', 'image'),
    )
    .select('images.id')
    .where('images.album_id', '=', albumId)
    .where('images.status', '=', 'active')
    .where('media_files.absolute_path', '=', filename)
    .executeTakeFirst()
  if (alreadyAttached) return true

  await throttle()
  const res = await fetch(best.uri, { headers: authHeaders() })
  if (!res.ok) {
    const msg = `Discogs image download failed: ${res.status}`
    errorLogService.record({ source: 'discogs', message: msg, context: `download for album ${albumId}` })
    throw new Error(msg)
  }
  const buffer = Buffer.from(await res.arrayBuffer())

  const dir = path.join(imagesDir, 'albums')
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, filename), buffer)
  await createSmallVersion(path.join(dir, filename))

  const existingPrimary = await db
    .selectFrom('images').select('id').where('album_id', '=', albumId).where('is_primary', '=', true).executeTakeFirst()
  const isPrimary = !existingPrimary

  const image = await db
    .insertInto('images')
    .values({ album_id: albumId, is_primary: isPrimary, source: 'discogs', status: 'active' })
    .returningAll()
    .executeTakeFirstOrThrow()
  await db
    .insertInto('media_files')
    .values({
      entity_type: 'image', entity_id: image.id, discriminator: 'image',
      absolute_path: filename, name: filename, file_type: 'image',
      created_at: new Date(), updated_at: new Date(),
    })
    .execute()
  if (isPrimary) {
    await db.updateTable('albums').set({ image_path: filename, updated_at: new Date() }).where('id', '=', albumId).execute()
  }
  return true
}
