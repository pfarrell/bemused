// server/src/routes/imageDownloadRoutes.ts
import { Hono } from 'hono'
import { db } from '../db/database.js'
import type { Variables } from '../types.js'
import { requireAuth } from '../middleware/auth.js'
import { loadOwned } from '../utils/http.js'
import { downloadToDisk, ImageStorageError } from '../services/imageStorage.js'

type ImageKind = 'playlist' | 'collection'

const TABLES = { playlist: 'playlists', collection: 'collections' } as const

// POST /:id/image — download an image from a URL and make it the entity's
// cover (owner or admin only). Images land in the shared albums image
// directory, the same place album covers live. Mount on that entity's
// router, e.g. playlists.route('/', createImageDownloadRoutes('playlist')).
export function createImageDownloadRoutes(kind: ImageKind) {
  const table = TABLES[kind]
  const router = new Hono<{ Variables: Variables }>()

  router.post('/:id/image', requireAuth, loadOwned(table), async (c) => {
    const owned = c.get('owned')!

    const { image_url, image_name } = await c.req.json()
    if (!image_url || !image_name) {
      return c.json({ error: 'image_url and image_name are required' }, 400)
    }

    try {
      await downloadToDisk(image_url, image_name, 'albums')

      const updated = await db
        .updateTable(table)
        .set({ image_path: image_name, updated_at: new Date() })
        .where('id', '=', owned.id)
        .returningAll()
        .executeTakeFirst()

      if (!updated) return c.json({ error: `${kind} not found` }, 404)
      return c.json({ success: true, [kind]: updated })
    } catch (error) {
      if (error instanceof ImageStorageError) return c.json({ error: error.message }, 400)
      console.error(`Error downloading/saving ${kind} image:`, error)
      return c.json({ error: 'Failed to save image' }, 500)
    }
  })

  return router
}
