// GET /search/spotify — kept out of search.test.ts because none of these
// cases touch the database (fetch is stubbed; no real Spotify credentials).
import { test, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { Hono } from 'hono'
import search from './search.js'
import { resetSpotifyTokenCache } from '../services/spotify.js'

const realFetch = globalThis.fetch
const realEnv = { id: process.env.SPOTIFY_CLIENT_ID, secret: process.env.SPOTIFY_CLIENT_SECRET }
let searchUrls: string[] = []

const app = new Hono()
app.route('/search', search)

function stubSpotify(searchResponse: () => Response) {
  globalThis.fetch = (async (url: any) => {
    if (String(url).startsWith('https://accounts.spotify.com/')) {
      return new Response(JSON.stringify({ access_token: 'tok', expires_in: 3600 }))
    }
    searchUrls.push(String(url))
    return searchResponse()
  }) as any
}

beforeEach(() => {
  process.env.SPOTIFY_CLIENT_ID = 'cid'
  process.env.SPOTIFY_CLIENT_SECRET = 'csecret'
  resetSpotifyTokenCache()
  searchUrls = []
})
after(() => {
  globalThis.fetch = realFetch
  if (realEnv.id === undefined) delete process.env.SPOTIFY_CLIENT_ID; else process.env.SPOTIFY_CLIENT_ID = realEnv.id
  if (realEnv.secret === undefined) delete process.env.SPOTIFY_CLIENT_SECRET; else process.env.SPOTIFY_CLIENT_SECRET = realEnv.secret
})

test('GET /search/spotify without q is a 400', async () => {
  stubSpotify(() => new Response('{}'))
  assert.equal((await app.request('/search/spotify')).status, 400)
  assert.equal((await app.request('/search/spotify?q=%20%20')).status, 400)
  assert.equal((await app.request('/search/spotify?q=%22%22')).status, 400)
  assert.equal(searchUrls.length, 0)
})

test('GET /search/spotify when unconfigured is 200 with configured:false and empty lists', async () => {
  delete process.env.SPOTIFY_CLIENT_ID
  stubSpotify(() => { throw new Error('should not be called') })
  const res = await app.request('/search/spotify?q=radiohead')
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { configured: false, tracks: [], albums: [], artists: [] })
})

test('GET /search/spotify returns mapped results and sends the raw (unquoted, unfiltered) query', async () => {
  stubSpotify(() => new Response(JSON.stringify({
    artists: { items: [{ id: 'ar1', uri: 'spotify:artist:ar1', name: 'The The', images: [] }] },
  })))
  const res = await app.request('/search/spotify?q=' + encodeURIComponent('  "The The"  '))
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.configured, true)
  assert.deepEqual(body.tracks, [])
  assert.deepEqual(body.albums, [])
  assert.deepEqual(body.artists, [{ uri: 'spotify:artist:ar1', id: 'ar1', name: 'The The', imageUrl: null, externalUrl: null }])
  assert.equal(new URL(searchUrls[0]).searchParams.get('q'), 'The The')
})

test('GET /search/spotify passes a Spotify 429 through with retryAfter', async () => {
  stubSpotify(() => new Response('', { status: 429, headers: { 'Retry-After': '12' } }))
  const res = await app.request('/search/spotify?q=x')
  assert.equal(res.status, 429)
  assert.equal(res.headers.get('Retry-After'), '12')
  assert.equal((await res.json()).retryAfter, 12)
})

test('GET /search/spotify maps other upstream failures to 502', async () => {
  stubSpotify(() => new Response('', { status: 500 }))
  const res = await app.request('/search/spotify?q=x')
  assert.equal(res.status, 502)
})
