import { Hono } from 'hono'
import { getAlbumSummary } from '../services/wikipedia.js'
import { streamBase } from '../db/streamUrl.js'
import { albumsService } from '../services/albumsService.js'

const albums = new Hono()

// GET /albums/random?size=N&tag=slug
albums.get('/random', async (c) => {
  const size = Math.min(parseInt(c.req.query('size') ?? '10'), 200)
  const tag = c.req.query('tag')

  const rows = tag
    ? await albumsService.randomByTag(tag, size)
    : await albumsService.randomAll(size)

  return c.json(rows.rows.map((row: any) => ({
    id: row.id,
    title: row.title,
    image_path: row.image_path,
    artist: { id: row.artist_id, name: row.artist_name },
  })))
})

// GET /album/:id
albums.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'))

  const album = await albumsService.findAlbumById(id)

  if (!album) return c.json({ error: 'Not found' }, 404)

  const artist = await albumsService.findArtistById(album.artist_id)

  if (!artist) return c.json({ error: 'Artist not found' }, 404)

  // Fetch tracks with their artist info (track-level artist override)
  const trackRows = await albumsService.findTracksByAlbumId(id)

  trackRows.sort((a, b) => (parseInt(a.track_number ?? '0') || 0) - (parseInt(b.track_number ?? '0') || 0))

  const tracks = trackRows.map((t) => ({
    id: t.id,
    title: t.title,
    track_number: t.track_number,
    duration: t.duration_sec,
    album: { id: album.id, title: album.title, artist: { id: artist.id, name: artist.name } },
    artist: { id: t.artist_id ?? artist.id, name: t.artist_name ?? artist.name },
    image_path: album.image_path,
    url: `${streamBase(c)}/stream/${t.id}`,
    download_url: `${streamBase(c)}/download/${t.id}`,
  }))

  const secondaryArtistRows = await albumsService.findSecondaryArtistsByAlbumId(id)

  const secondary_artists = secondaryArtistRows.map(r => ({ id: r.id, name: r.name, role: r.role }))

  // For various-artists albums, list every distinct artist credited on a
  // track (deduplicated, first-occurrence/track order) so the frontend can
  // show them in place of a single owning artist.
  const compilation_artists: { id: number; name: string }[] = []
  if (album.is_compilation) {
    const seen = new Set<number>()
    for (const t of tracks) {
      if (!seen.has(t.artist.id)) {
        seen.add(t.artist.id)
        compilation_artists.push(t.artist)
      }
    }
  }

  const summary = await getAlbumSummary(
    artist.name,
    album.title,
    artist.wikipedia,
    album.wikipedia
  )

  return c.json({ album, artist, secondary_artists, compilation_artists, tracks, summary: summary ?? {} })
})

export default albums
