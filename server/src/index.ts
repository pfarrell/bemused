import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Variables } from './types.js'
import artists from './routes/artists.js'
import albums from './routes/albums.js'
import tracks from './routes/tracks.js'
import search from './routes/search.js'
import streams, { downloads } from './routes/streams.js'
import logs from './routes/logs.js'
import playlists from './routes/playlists.js'
import collections from './routes/collections.js'
import favorites from './routes/favorites.js'
import tags from './routes/tags.js'
import share from './routes/share.js'
import lookup from './routes/lookup.js'
import admin from './routes/admin.js'
import upload from './routes/upload.js'
import auth from './routes/auth.js'
import errors from './routes/errors.js'
import signups from './routes/signups.js'
import { errorLogService } from './services/errorLogService.js'
import { authMiddleware, requireAdmin, requireAuth } from './middleware/auth.js'

const app = new Hono<{ Variables: Variables }>()

app.use('*', cors({
  origin: (origin) => {
    // Allow all origins in development, specific origins in production
    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = [
        'https://patf.net',
        'https://www.patf.net',
        'https://patf.com',
        'https://www.patf.com',
        'http://172.16.1.10',
        'http://172.16.1.10:5173'
      ]
      return allowedOrigins.includes(origin || '') ? origin : allowedOrigins[0]
    }
    return origin || '*'
  },
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 600,
  credentials: true,
}))

// Apply auth middleware globally to extract user from cookies
app.use('*', authMiddleware)

app.onError((err, c) => {
  console.error(err)
  errorLogService.record({
    source: 'http',
    message: err.message,
    context: `${c.req.method} ${c.req.path}`,
  })
  return c.json({ error: err.message, stack: err.stack }, 500)
})

// Health check
app.get('/health', (c) => c.json({ ok: true }))

// Auth routes (public — /login, /signup(admin-gated), /me, /google/* need to be
// reachable without a session; the rest of this router self-checks c.get('user'))
app.route('/auth', auth)

// Public: unfurl-only HTML for social link previews, no protected data.
app.route('/share', share)

// Everything else requires a logged-in session — the whole site is private
// except the login page and the OG-preview route above.
const protectedApp = new Hono()
protectedApp.use('*', requireAuth)

protectedApp.route('/artists', artists)
protectedApp.route('/artist', artists)   // singular alias used by frontend (/artist/:id)
protectedApp.route('/albums', albums)
protectedApp.route('/album', albums)     // singular alias
protectedApp.route('/track', tracks)
protectedApp.route('/search', search)
protectedApp.route('/stream', streams)
protectedApp.route('/download', downloads)
protectedApp.route('/log', logs)
protectedApp.route('/playlist', playlists)
protectedApp.route('/playlists', playlists)
protectedApp.route('/collection', collections)
protectedApp.route('/collections', collections)
protectedApp.route('/favorites', favorites)
protectedApp.route('/tags', tags)
protectedApp.route('/lookup', lookup)
protectedApp.route('/top', playlists)
protectedApp.route('/newborns', playlists)
protectedApp.route('/surprise', playlists)

// Playlist/collection owners (not just site admins) can reach some routes under
// the /admin/playlist and /admin/collection URL space (e.g. POST .../:id/image,
// which AdminPlaylist.jsx/AdminCollection.jsx call to download a cover image).
// These routers do their own canModify(owner-or-admin) checks per route beyond
// the login requirement, so they're mounted here rather than under adminApp's
// blanket requireAdmin.
protectedApp.route('/admin/playlist', playlists)
protectedApp.route('/admin/collection', collections)

app.route('/', protectedApp)

// Admin routes (protected)
const adminApp = new Hono()
adminApp.use('*', requireAdmin)
adminApp.route('/', admin)
adminApp.route('/upload', upload)
adminApp.route('/errors', errors)
adminApp.route('/signups', signups)
app.route('/admin', adminApp)

const port = parseInt(process.env.PORT ?? '3939')

console.log(`Bemused API server starting on port ${port}`)

serve({ fetch: app.fetch, port })
