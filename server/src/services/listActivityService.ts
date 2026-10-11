import { sql } from 'kysely'
import { db } from '../db/database.js'

// "Recent" sort for the Jukebox playlist/collection grids: the later of the
// row's last edit and its last logged play.
type Kind = 'playlist' | 'collection'

export async function lastActivityByIds(
  kind: Kind,
  rows: { id: number; updated_at: Date | string | null }[],
): Promise<Map<number, string | null>> {
  const out = new Map<number, string | null>()
  if (rows.length === 0) return out
  const ids = rows.map((r) => r.id)
  const column = sql.ref(kind === 'playlist' ? 'playlist_id' : 'collection_id')
  const played = await sql<{ id: number; last_played: Date }>`
    SELECT ${column} AS id, MAX(created_at) AS last_played
    FROM logs
    WHERE ${column} IN (${sql.join(ids)})
    GROUP BY ${column}
  `.execute(db)
  const playedById = new Map(played.rows.map((r) => [r.id, new Date(r.last_played).getTime()]))
  for (const r of rows) {
    const edited = r.updated_at ? new Date(r.updated_at).getTime() : 0
    const latest = Math.max(edited, playedById.get(r.id) ?? 0)
    out.set(r.id, latest > 0 ? new Date(latest).toISOString() : null)
  }
  return out
}
