import { getAlbumYear } from './formatters';

const compareTitles = (a, b) =>
  (a.title ?? '').localeCompare(b.title ?? '', undefined, { sensitivity: 'base', numeric: true });

/**
 * Sort an artist's albums for display. Never mutates the input.
 * - 'newest' / 'oldest': dated albums by year (title as tie-break), with
 *   undated albums after them, alphabetically — same grouping the backend uses.
 * - 'alpha': every album by title, ignoring year.
 * @param {Array} albums
 * @param {'newest'|'oldest'|'alpha'} sortBy
 * @returns {Array}
 */
export const sortAlbums = (albums, sortBy) => {
  if (!Array.isArray(albums)) return [];
  const sorted = [...albums];
  if (sortBy === 'alpha') return sorted.sort(compareTitles);

  const direction = sortBy === 'oldest' ? 1 : -1;
  return sorted.sort((a, b) => {
    const yearA = getAlbumYear(a.release_year);
    const yearB = getAlbumYear(b.release_year);
    if (yearA && !yearB) return -1;
    if (!yearA && yearB) return 1;
    if (yearA && yearB && yearA !== yearB) {
      return direction * String(yearA).localeCompare(String(yearB), undefined, { numeric: true });
    }
    return compareTitles(a, b);
  });
};
