import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseExternalLink } from './externalLinks.js'

test('parses discogs release, master and artist URLs', () => {
  assert.deepEqual(parseExternalLink('https://www.discogs.com/release/1234567-Some-Album'), {
    source: 'discogs', kind: 'release', external_id: '1234567', url: 'https://www.discogs.com/release/1234567',
  })
  assert.equal(parseExternalLink('https://www.discogs.com/en/master/42-Foo')?.kind, 'master')
  assert.equal(parseExternalLink('discogs.com/artist/99-Bar')?.external_id, '99')
})

test('bare numeric id needs a discogs hint', () => {
  assert.equal(parseExternalLink('123'), null)
  assert.equal(parseExternalLink('123', { source: 'discogs', kind: 'release' })?.url, 'https://www.discogs.com/release/123')
  assert.equal(parseExternalLink('123', { source: 'discogs', kind: 'bogus' }), null)
})

test('rejects discogs URLs without an id and non-http schemes', () => {
  assert.equal(parseExternalLink('https://www.discogs.com/search?q=x'), null)
  assert.equal(parseExternalLink('javascript:alert(1)'), null)
  assert.equal(parseExternalLink(''), null)
})

test('parses wikidata, bandcamp, allmusic and falls back to other', () => {
  assert.equal(parseExternalLink('https://www.wikidata.org/wiki/q123')?.external_id, 'Q123')
  assert.equal(parseExternalLink('https://artist.bandcamp.com/album/x')?.source, 'bandcamp')
  assert.equal(parseExternalLink('https://www.allmusic.com/album/foo-mw1')?.source, 'allmusic')
  assert.equal(parseExternalLink('https://example.com/page')?.source, 'other')
})
