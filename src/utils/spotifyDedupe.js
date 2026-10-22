// src/utils/spotifyDedupe.js
// Hides Spotify search results that duplicate something already in the local
// library results, so the "From Spotify" section only surfaces music the
// library doesn't have. Matching is exact on a normalized key (not fuzzy like
// titleMatch.js) — a false positive here would hide a genuinely different
// release, which is worse than showing an occasional near-duplicate.

// Lowercases, turns any run of punctuation/whitespace into a single space,
// and trims. \p{L}/\p{N} keep non-Latin letters and digits intact (so
// "Sigur Rós" still normalizes to something meaningful).
export function normalizeForMatch(value) {
  if (typeof value !== 'string') return '';
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

// Key for a (title, artist) pair; null when the title normalizes to nothing,
// so an untitled item never matches every other untitled item.
export function matchKey(title, artistName) {
  const t = normalizeForMatch(title);
  if (!t) return null;
  return `${t}|${normalizeForMatch(artistName)}`;
}

// Arrays only, and only object entries — anything else from a malformed
// response is dropped here so render code can assume `item` is an object.
const objects = (value) => (Array.isArray(value) ? value.filter((v) => v && typeof v === 'object') : []);

const keySet = (items, toKey) => new Set(items.map(toKey).filter(Boolean));

const firstArtistName = (item) => objects(item.artists)[0]?.name;

/**
 * @param {{ tracks?, albums?, artists? }} spotify - /search/spotify response body
 * @param {{ results?, tracks? }} local - /search response body (results are
 *   `{ type, data }` entries; tracks are local track rows)
 * @returns {{ tracks, albums, artists }} spotify lists minus local duplicates,
 *   always arrays of objects even if the input was missing/malformed
 */
export function filterSpotifyDuplicates(spotify, local) {
  const localResults = objects(local?.results);
  const localTrackKeys = keySet(objects(local?.tracks), (t) => matchKey(t.title, t.artist?.name));
  const localAlbumKeys = keySet(
    localResults.filter((r) => r.type === 'album'),
    (r) => matchKey(r.data?.title, r.data?.artist?.name)
  );
  const localArtistKeys = keySet(
    localResults.filter((r) => r.type === 'artist'),
    (r) => matchKey(r.data?.name, '')
  );

  return {
    tracks: objects(spotify?.tracks).filter((t) => !localTrackKeys.has(matchKey(t.name, firstArtistName(t)))),
    albums: objects(spotify?.albums).filter((a) => !localAlbumKeys.has(matchKey(a.name, firstArtistName(a)))),
    artists: objects(spotify?.artists).filter((a) => !localArtistKeys.has(matchKey(a.name, ''))),
  };
}
