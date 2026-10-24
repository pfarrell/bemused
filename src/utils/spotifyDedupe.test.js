import { normalizeForMatch, matchKey, filterSpotifyDuplicates } from './spotifyDedupe';

describe('normalizeForMatch', () => {
  test('lowercases and collapses punctuation and whitespace runs', () => {
    expect(normalizeForMatch('  Don\'t  Stop -- Me   Now! ')).toBe('don t stop me now');
  });

  test('treats differently punctuated titles as equal', () => {
    expect(normalizeForMatch('AC/DC')).toBe(normalizeForMatch('ac dc'));
    expect(normalizeForMatch('Rumours (Deluxe)')).toBe('rumours deluxe');
  });

  test('keeps non-Latin letters and digits', () => {
    expect(normalizeForMatch('Sigur Rós')).toBe('sigur rós');
    expect(normalizeForMatch('1999')).toBe('1999');
  });

  test('returns an empty string for non-strings', () => {
    expect(normalizeForMatch(null)).toBe('');
    expect(normalizeForMatch(undefined)).toBe('');
    expect(normalizeForMatch({ name: 'x' })).toBe('');
  });
});

describe('matchKey', () => {
  test('combines title and artist', () => {
    expect(matchKey('Dreams', 'Fleetwood Mac')).toBe('dreams|fleetwood mac');
  });

  test('is null when the title is empty or punctuation-only', () => {
    expect(matchKey('', 'Artist')).toBeNull();
    expect(matchKey('...', 'Artist')).toBeNull();
    expect(matchKey(null, 'Artist')).toBeNull();
  });
});

describe('filterSpotifyDuplicates', () => {
  const local = {
    results: [
      { type: 'artist', data: { id: 1, name: 'Fleetwood Mac' } },
      { type: 'album', data: { id: 2, title: 'Rumours', artist: { id: 1, name: 'Fleetwood Mac' } } },
    ],
    tracks: [{ id: 3, title: 'Dreams', artist: { id: 1, name: 'Fleetwood Mac' } }],
  };

  test('removes tracks, albums, and artists that match local results', () => {
    const spotify = {
      tracks: [
        { id: 't1', name: 'Dreams!', artists: [{ name: 'FLEETWOOD MAC' }] },
        { id: 't2', name: 'Dreams', artists: [{ name: 'The Cranberries' }] },
      ],
      albums: [
        { id: 'a1', name: 'Rumours', artists: [{ name: 'Fleetwood Mac' }] },
        { id: 'a2', name: 'Tusk', artists: [{ name: 'Fleetwood Mac' }] },
      ],
      artists: [
        { id: 'r1', name: 'Fleetwood  Mac' },
        { id: 'r2', name: 'Stevie Nicks' },
      ],
    };

    const out = filterSpotifyDuplicates(spotify, local);
    expect(out.tracks.map((t) => t.id)).toEqual(['t2']);
    expect(out.albums.map((a) => a.id)).toEqual(['a2']);
    expect(out.artists.map((a) => a.id)).toEqual(['r2']);
  });

  test('only compares against the first Spotify artist', () => {
    const spotify = {
      tracks: [{ id: 't1', name: 'Dreams', artists: [{ name: 'Someone Else' }, { name: 'Fleetwood Mac' }] }],
    };
    expect(filterSpotifyDuplicates(spotify, local).tracks).toHaveLength(1);
  });

  test('tolerates missing or malformed input', () => {
    expect(filterSpotifyDuplicates(null, null)).toEqual({ tracks: [], albums: [], artists: [] });
    const out = filterSpotifyDuplicates(
      { tracks: [{ id: 't', name: 'X', artists: null }], albums: 'nope', artists: [null, 'str'] },
      { results: [{ type: 'album', data: null }, null], tracks: [null] }
    );
    expect(out.tracks).toHaveLength(1);
    expect(out.albums).toEqual([]);
    expect(out.artists).toEqual([]);
  });
});
