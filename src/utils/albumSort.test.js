import { sortAlbums } from './albumSort';

const album = (id, title, release_year) => ({ id, title, release_year });

const albums = [
  album(1, 'Zuma', '1975'),
  album(2, 'Harvest', '1972'),
  album(3, 'unreleased demos', null),
  album(4, 'After the Gold Rush', '1970'),
  album(5, 'Bootleg', '0'),
  album(6, 'American Stars', '1977'),
];

const ids = (list) => list.map((a) => a.id);

describe('sortAlbums', () => {
  test('newest: dated albums newest first, undated albums last alphabetically', () => {
    expect(ids(sortAlbums(albums, 'newest'))).toEqual([6, 1, 2, 4, 5, 3]);
  });

  test('oldest: dated albums oldest first, undated albums last alphabetically', () => {
    expect(ids(sortAlbums(albums, 'oldest'))).toEqual([4, 2, 1, 6, 5, 3]);
  });

  test('alpha: every album by title, case-insensitive, ignoring year', () => {
    expect(ids(sortAlbums(albums, 'alpha'))).toEqual([4, 6, 5, 2, 3, 1]);
  });

  test('breaks year ties by title', () => {
    const tied = [album(1, 'B', '1980'), album(2, 'A', '1980')];
    expect(ids(sortAlbums(tied, 'newest'))).toEqual([2, 1]);
    expect(ids(sortAlbums(tied, 'oldest'))).toEqual([2, 1]);
  });

  test('does not mutate the input', () => {
    const copy = [...albums];
    sortAlbums(albums, 'alpha');
    expect(albums).toEqual(copy);
  });

  test('returns an empty array for missing input', () => {
    expect(sortAlbums(undefined, 'newest')).toEqual([]);
  });
});
