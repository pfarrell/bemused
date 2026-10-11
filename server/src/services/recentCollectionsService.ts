import { sql } from 'kysely'
import { db } from '../db/database.js'

export const recentCollectionsService = {
  // Collections ranked by their most recent logged play (logs.collection_id is
  // set by GET /log/:id when the queue's source was that collection).
  async recentlyPlayed(size: number) {
    const result = await sql<{ id: number; name: string; image_path: string | null; last_played: Date }>`
      SELECT c.id, c.name, c.image_path, MAX(lg.created_at) AS last_played
      FROM logs lg
      INNER JOIN collections c ON c.id = lg.collection_id
      WHERE lg.collection_id IS NOT NULL
      GROUP BY c.id, c.name, c.image_path
      ORDER BY last_played DESC
      LIMIT ${size}
    `.execute(db)
    return result.rows
  },
}
