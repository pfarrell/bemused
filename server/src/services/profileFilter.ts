import { pool } from '../db/database.js'
import { profilesService } from './profilesService.js'

// Raw-SQL predicates for "does this row match one of the profile's tags",
// shared by search's UNION query and the playlist/collection list endpoints
// so the rules live in exactly one place. `tagParam` is the placeholder
// (e.g. '$3') bound to the profile's tag-id array.

// An album matches if it carries the tag itself OR its own artist
// (albums.artist_id) does — tagging an artist surfaces all of its albums.
export function albumTagMatchSql(albumAlias: string, tagParam: string): string {
  return `(
    EXISTS (SELECT 1 FROM albums_tags atag WHERE atag.album_id = ${albumAlias}.id AND atag.tag_id = ANY(${tagParam}))
    OR EXISTS (SELECT 1 FROM artists_tags atag2 WHERE atag2.artist_id = ${albumAlias}.artist_id AND atag2.tag_id = ANY(${tagParam}))
  )`
}

// A playlist matches only via its own tags — its tracks don't count.
export function playlistTagMatchSql(playlistAlias: string, tagParam: string): string {
  return `EXISTS (SELECT 1 FROM playlists_tags ptag WHERE ptag.playlist_id = ${playlistAlias}.id AND ptag.tag_id = ANY(${tagParam}))`
}

// A collection matches via its own tags OR by containing at least one
// matching album (same rule as albumTagMatchSql). Opening a matching
// collection still shows all of its albums — this only decides visibility.
export function collectionTagMatchSql(collectionAlias: string, tagParam: string): string {
  return `(
    EXISTS (SELECT 1 FROM collections_tags ctag WHERE ctag.collection_id = ${collectionAlias}.id AND ctag.tag_id = ANY(${tagParam}))
    OR EXISTS (
      SELECT 1 FROM collection_albums ca
      INNER JOIN albums cal ON cal.id = ca.album_id
      WHERE ca.collection_id = ${collectionAlias}.id AND ${albumTagMatchSql('cal', tagParam)}
    )
  )`
}

// ?profileId= → the tag ids to filter by, or null for "no filter". An
// unrecognized profileId means "no match", never an error: a non-numeric
// value resolves to [] without a query, and a numeric id with no profile row
// falls out of getTagIds() as [] on its own.
export async function resolveProfileTagIds(raw: string | undefined): Promise<number[] | null> {
  if (!raw) return null
  const profileId = parseInt(raw)
  return Number.isNaN(profileId) ? [] : profilesService.getTagIds(profileId)
}

export async function matchingPlaylistIds(tagIds: number[]): Promise<number[]> {
  if (tagIds.length === 0) return []
  const { rows } = await pool.query<{ id: number }>(
    `SELECT p.id FROM playlists p WHERE ${playlistTagMatchSql('p', '$1')}`,
    [tagIds]
  )
  return rows.map((r) => r.id)
}

export async function matchingCollectionIds(tagIds: number[]): Promise<number[]> {
  if (tagIds.length === 0) return []
  const { rows } = await pool.query<{ id: number }>(
    `SELECT c.id FROM collections c WHERE ${collectionTagMatchSql('c', '$1')}`,
    [tagIds]
  )
  return rows.map((r) => r.id)
}
