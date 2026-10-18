import 'dotenv/config'
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { createArtist, createAlbum, createTrack, createTag, tagAlbum, tagArtist, tagTrack, createPlaylist, createCollection, tagPlaylist, tagCollection, addAlbumToCollection, cleanupFixtures } from '../test/fixtures.js'
import { searchService } from './searchService.js'

after(cleanupFixtures)

test('runUnionSearch with tagIds only matches albums/artists carrying one of those tags', async () => {
  const artist = await createArtist('search-tagids-artist')
  const matchingAlbum = await createAlbum('search-tagids-matching-zzzunique', artist.id)
  const nonMatchingAlbum = await createAlbum('search-tagids-nonmatching-zzzunique', artist.id)
  await createTrack('search-tagids-matching-track', matchingAlbum.id, artist.id)
  await createTrack('search-tagids-nonmatching-track', nonMatchingAlbum.id, artist.id)
  const tag = await createTag('search-tagids-tag')
  await tagAlbum(matchingAlbum.id, tag.id)

  const rows = await searchService.runUnionSearch('%zzzunique%', 'zzzunique', false, 30, 0, [tag.id])
  const albumRows = rows.filter((r: any) => r.model_type === 'Album')
  const ids = albumRows.map((r: any) => r.id)

  assert.ok(ids.includes(matchingAlbum.id))
  assert.equal(ids.includes(nonMatchingAlbum.id), false)
})

test('runUnionSearch with an empty tagIds array drops every type, playlists/collections included', async () => {
  // A profile can end up with zero tags (e.g. its last tag was deleted,
  // cascading through profile_tags) — that profile matches nothing, and
  // playlists/collections are tag-filtered now too.
  const artist = await createArtist('search-emptytags-artist')
  const album = await createAlbum('search-emptytags-album-zzzemptytags', artist.id)
  await createTrack('search-emptytags-track', album.id, artist.id)
  const playlist = await createPlaylist('search-emptytags-playlist-zzzemptytags')
  const collection = await createCollection('search-emptytags-collection-zzzemptytags')

  const unfiltered = await searchService.runUnionSearch('%zzzemptytags%', 'zzzemptytags', false, 30, 0, null)
  assert.ok(unfiltered.some((r: any) => r.model_type === 'Playlist' && r.id === playlist.id))
  assert.ok(unfiltered.some((r: any) => r.model_type === 'Collection' && r.id === collection.id))

  const rows = await searchService.runUnionSearch('%zzzemptytags%', 'zzzemptytags', false, 30, 0, [])
  assert.equal(rows.some((r: any) => r.model_type === 'Playlist' && r.id === playlist.id), false)
  assert.equal(rows.some((r: any) => r.model_type === 'Collection' && r.id === collection.id), false)
  assert.equal(rows.some((r: any) => r.model_type === 'Album' && r.id === album.id), false)
})

test('countRankedResults with an empty tagIds array zeroes every type', async () => {
  const artist = await createArtist('search-emptytags-count-artist')
  const album = await createAlbum('search-emptytags-count-album-zzzemptycount', artist.id)
  await createTrack('search-emptytags-count-track', album.id, artist.id)
  await createPlaylist('search-emptytags-count-playlist-zzzemptycount')

  const counts = await searchService.countRankedResults('%zzzemptycount%', 'zzzemptycount', false, [])

  assert.deepEqual(counts, { Album: 0, Artist: 0, Playlist: 0, Collection: 0 })
})

test('runUnionSearch with tagIds keeps only playlists carrying one of those tags', async () => {
  const tag = await createTag('search-playlist-tag')
  const tagged = await createPlaylist('search-playlist-tagged-zzzplaylisttag')
  const untagged = await createPlaylist('search-playlist-untagged-zzzplaylisttag')
  await tagPlaylist(tagged.id, tag.id)

  for (const exactOnly of [false, true]) {
    const rows = await searchService.runUnionSearch('%zzzplaylisttag%', exactOnly ? '' : 'zzzplaylisttag', exactOnly, 30, 0, [tag.id])
    assert.ok(rows.some((r: any) => r.model_type === 'Playlist' && r.id === tagged.id), `exactOnly=${exactOnly}`)
    assert.equal(rows.some((r: any) => r.model_type === 'Playlist' && r.id === untagged.id), false, `exactOnly=${exactOnly}`)
  }
})

test('runUnionSearch with tagIds keeps collections tagged directly or containing a matching album', async () => {
  const tag = await createTag('search-collection-tag')
  const artist = await createArtist('search-collection-artist')
  const taggedAlbum = await createAlbum('search-collection-tagged-album', artist.id)
  const plainAlbum = await createAlbum('search-collection-plain-album', artist.id)
  await tagAlbum(taggedAlbum.id, tag.id)

  const taggedDirectly = await createCollection('search-collection-direct-zzzcollectiontag')
  await tagCollection(taggedDirectly.id, tag.id)
  const viaAlbum = await createCollection('search-collection-viaalbum-zzzcollectiontag')
  await addAlbumToCollection(viaAlbum.id, plainAlbum.id)
  await addAlbumToCollection(viaAlbum.id, taggedAlbum.id)
  const noMatch = await createCollection('search-collection-nomatch-zzzcollectiontag')
  await addAlbumToCollection(noMatch.id, plainAlbum.id)

  const rows = await searchService.runUnionSearch('%zzzcollectiontag%', 'zzzcollectiontag', false, 30, 0, [tag.id])
  const ids = rows.filter((r: any) => r.model_type === 'Collection').map((r: any) => r.id)
  assert.ok(ids.includes(taggedDirectly.id))
  assert.ok(ids.includes(viaAlbum.id))
  assert.equal(ids.includes(noMatch.id), false)

  const counts = await searchService.countRankedResults('%zzzcollectiontag%', 'zzzcollectiontag', false, [tag.id])
  assert.equal(counts.Collection, 2)
})

test('runUnionSearch matches a collection via an album whose artist carries the tag', async () => {
  const tag = await createTag('search-collection-artisttag-tag')
  const artist = await createArtist('search-collection-artisttag-artist')
  const album = await createAlbum('search-collection-artisttag-album', artist.id)
  await tagArtist(artist.id, tag.id)
  const collection = await createCollection('search-collection-artisttag-zzzcollartisttag')
  await addAlbumToCollection(collection.id, album.id)

  const rows = await searchService.runUnionSearch('%zzzcollartisttag%', 'zzzcollartisttag', false, 30, 0, [tag.id])
  assert.ok(rows.some((r: any) => r.model_type === 'Collection' && r.id === collection.id))
})

test('findTrackIds with tagIds only returns tracks carrying one of those tags', async () => {
  const artist = await createArtist('search-track-tagids-artist')
  const album = await createAlbum('search-track-tagids-album', artist.id)
  const matching = await createTrack('search-track-tagids-matching-zzzunique', album.id, artist.id)
  const nonMatching = await createTrack('search-track-tagids-nonmatching-zzzunique', album.id, artist.id)
  const tag = await createTag('search-track-tagids-tag')
  await tagTrack(matching.id, tag.id)

  const ids = await searchService.findTrackIds('%zzzunique%', [tag.id])

  assert.ok(ids.includes(matching.id))
  assert.equal(ids.includes(nonMatching.id), false)
})

test('findTrackIds with an empty tagIds array returns nothing', async () => {
  const ids = await searchService.findTrackIds('%a%', [])
  assert.deepEqual(ids, [])
})

test('runUnionSearch with tagIds excludes artists lacking the tag (artists_tags branch)', async () => {
  const matchingArtist = await createArtist('search-tagids-artistbranch-matching-zzzartisttag')
  const nonMatchingArtist = await createArtist('search-tagids-artistbranch-nonmatching-zzzartisttag')
  const matchingAlbum = await createAlbum('search-tagids-artistbranch-matching-album', matchingArtist.id)
  const nonMatchingAlbum = await createAlbum('search-tagids-artistbranch-nonmatching-album', nonMatchingArtist.id)
  await createTrack('search-tagids-artistbranch-matching-track', matchingAlbum.id, matchingArtist.id)
  await createTrack('search-tagids-artistbranch-nonmatching-track', nonMatchingAlbum.id, nonMatchingArtist.id)
  const tag = await createTag('search-tagids-artistbranch-tag')
  await tagArtist(matchingArtist.id, tag.id)

  const rows = await searchService.runUnionSearch('%zzzartisttag%', 'zzzartisttag', false, 30, 0, [tag.id])
  const artistIds = rows.filter((r: any) => r.model_type === 'Artist').map((r: any) => r.id)

  assert.ok(artistIds.includes(matchingArtist.id))
  assert.equal(artistIds.includes(nonMatchingArtist.id), false)
})

test('runUnionSearch filters by tagIds when exactOnly=true (exercises the $2 tagParamIndex path)', async () => {
  const artist = await createArtist('search-tagids-exactonly-artist')
  const matchingAlbum = await createAlbum('search-tagids-exactonly-matching-zzzexactonlyunique', artist.id)
  const nonMatchingAlbum = await createAlbum('search-tagids-exactonly-nonmatching-zzzexactonlyunique', artist.id)
  await createTrack('search-tagids-exactonly-matching-track', matchingAlbum.id, artist.id)
  await createTrack('search-tagids-exactonly-nonmatching-track', nonMatchingAlbum.id, artist.id)
  const tag = await createTag('search-tagids-exactonly-tag')
  await tagAlbum(matchingAlbum.id, tag.id)

  // exactOnly=true means fuzzyClauses is '' and only $1 (likeParam) is used
  // for matching, so a supplied tagIds array becomes the query's ONLY other
  // parameter — $2, not $3. This proves that path resolves correctly.
  const rows = await searchService.runUnionSearch('%zzzexactonlyunique%', 'zzzexactonlyunique', true, 30, 0, [tag.id])
  const albumIds = rows.filter((r: any) => r.model_type === 'Album').map((r: any) => r.id)

  assert.ok(albumIds.includes(matchingAlbum.id))
  assert.equal(albumIds.includes(nonMatchingAlbum.id), false)
})

test('runUnionSearch matches an album via its artist\'s tag, even when the album has no tag of its own', async () => {
  const taggedArtist = await createArtist('search-inherit-tagged-artist')
  const untaggedArtist = await createArtist('search-inherit-untagged-artist')
  const inheritedAlbum = await createAlbum('search-inherit-album-zzzinherit', taggedArtist.id)
  const unrelatedAlbum = await createAlbum('search-inherit-unrelated-album-zzzinherit', untaggedArtist.id)
  await createTrack('search-inherit-inherited-track', inheritedAlbum.id, taggedArtist.id)
  await createTrack('search-inherit-unrelated-track', unrelatedAlbum.id, untaggedArtist.id)
  const tag = await createTag('search-inherit-tag')
  await tagArtist(taggedArtist.id, tag.id)

  const rows = await searchService.runUnionSearch('%zzzinherit%', 'zzzinherit', false, 30, 0, [tag.id])
  const albumIds = rows.filter((r: any) => r.model_type === 'Album').map((r: any) => r.id)

  assert.ok(albumIds.includes(inheritedAlbum.id));
  assert.equal(albumIds.includes(unrelatedAlbum.id), false)
})

test('runUnionSearch still matches an album via its own tag when its artist has no tag', async () => {
  const artist = await createArtist('search-inherit-ownonly-artist')
  const ownTagAlbum = await createAlbum('search-inherit-ownonly-album-zzzinheritown', artist.id)
  await createTrack('search-inherit-ownonly-track', ownTagAlbum.id, artist.id)
  const tag = await createTag('search-inherit-ownonly-tag')
  await tagAlbum(ownTagAlbum.id, tag.id)

  const rows = await searchService.runUnionSearch('%zzzinheritown%', 'zzzinheritown', false, 30, 0, [tag.id])
  const albumIds = rows.filter((r: any) => r.model_type === 'Album').map((r: any) => r.id)

  assert.ok(albumIds.includes(ownTagAlbum.id))
})

test('findTrackIds matches a track via its artist\'s tag, even when the track has no tag of its own', async () => {
  const taggedArtist = await createArtist('search-inherit-track-tagged-artist')
  const untaggedArtist = await createArtist('search-inherit-track-untagged-artist')
  const album = await createAlbum('search-inherit-track-album', taggedArtist.id)
  const inheritedTrack = await createTrack('search-inherit-track-inherited-zzzinherittrack', album.id, taggedArtist.id)
  const unrelatedTrack = await createTrack('search-inherit-track-unrelated-zzzinherittrack', album.id, untaggedArtist.id)
  const tag = await createTag('search-inherit-track-tag')
  await tagArtist(taggedArtist.id, tag.id)

  const ids = await searchService.findTrackIds('%zzzinherittrack%', [tag.id])

  assert.ok(ids.includes(inheritedTrack.id))
  assert.equal(ids.includes(unrelatedTrack.id), false)
})

test('countRankedResults with tagIds excludes non-matching albums/artists from the count', async () => {
  // Uses its own substring (zzzcounttagids, not zzzunique) so this test's
  // count isn't polluted by the albums the runUnionSearch tests above create
  // in the same file run — cleanupFixtures only runs once, in `after`, so
  // earlier tests' rows are still present (and would ILIKE-match `%zzzunique%`)
  // while this test runs.
  const artist = await createArtist('search-count-tagids-artist')
  const matchingAlbum = await createAlbum('search-count-tagids-matching-zzzcounttagids', artist.id)
  const nonMatchingAlbum = await createAlbum('search-count-tagids-nonmatching-zzzcounttagids', artist.id)
  await createTrack('search-count-tagids-matching-track', matchingAlbum.id, artist.id)
  await createTrack('search-count-tagids-nonmatching-track', nonMatchingAlbum.id, artist.id)
  const tag = await createTag('search-count-tagids-tag')
  await tagAlbum(matchingAlbum.id, tag.id)

  const unfiltered = await searchService.countRankedResults('%zzzcounttagids%', 'zzzcounttagids', false, null)
  const filtered = await searchService.countRankedResults('%zzzcounttagids%', 'zzzcounttagids', false, [tag.id])

  assert.equal(unfiltered.Album, 2)
  assert.equal(filtered.Album, 1)
})
