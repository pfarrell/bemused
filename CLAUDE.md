# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend (root)

```bash
npm run dev          # Vite dev server — proxies /api → localhost:3000 (prefix stripped)
npm run build        # Production build (base URL /bemused/app/)
npm run lint         # ESLint
npm run deploy       # Build and rsync frontend to /var/www/bemused/shared/public/frontend on patf.com
npm run full-deploy  # Build and deploy both frontend and backend
```

### Backend (server/)

```bash
npm run dev          # tsx watch — API server on port 3000
npm run build        # TypeScript compile
npm run start        # Run compiled JS
npm run worker       # Upload queue worker — must run as a separate process alongside dev server
npm run deploy       # Build and deploy to /var/www/bemused-node/releases/<timestamp> with symlinked current
npm run db:snapshot  # Dump PostgreSQL database to snapshots/
npm run db:restore   # Restore from a snapshot
npm run db:schema:dump  # Dump schema-only SQL to schema.sql
npm run db:reset     # Reset database
```

**Deploy commands by change type**: `npm run deploy` (frontend changes only), `cd server && npm run deploy` (backend changes only), `npm run full-deploy` (both layers changed).

## Specs and Plans

Design specs live in `docs/superpowers/specs/` and implementation plans in `docs/superpowers/plans/`. Never commit these files to git.

Frontend tests use Vitest + React Testing Library. Run with `npm test` (root). Test files live alongside source as `*.test.js` / `*.test.jsx`. Backend has no tests yet — tracked in [#31](https://github.com/pfarrell/bemused/issues/31).

## Architecture

This is a React SPA monorepo for a personal music streaming service called "P·Share". The monorepo has two layers: `src/` (React SPA frontend) and `server/` (Hono + Kysely + PostgreSQL backend). The Vite dev server proxies `/api` → `http://localhost:3000`, stripping the `/api` prefix — backend routes do **not** use an `/api` prefix. In production, the frontend deploys to `/var/www/bemused/shared/public/frontend` and the backend deploys to `/var/www/bemused-node/` with symlinked releases.

Images are served externally: `https://patf.net/images/` in production, `/images` in dev. The backend deploy symlinks `public/images` from a NAS share rather than serving images through the Node app.

## Frontend

**Routing** (`src/App.jsx`): All routes render inside `Layout`. The basename switches between `/` (dev) and `/bemused/app` (prod) via `import.meta.env.DEV`. Admin routes are wrapped in `<ProtectedRoute requireAdmin>`. Routes:
- `/` — Home (artist or album grid)
- `/search` — Search
- `/login`, `/signup` — Auth forms
- `/artist/:id`, `/album/:id` — Artist and album detail
- `/library` — User library
- `/playlists`, `/playlist/:id` — Playlists list and detail
- `/collections`, `/collection/:id` — Collections list and detail
- `/tags/:name` — Tag browse
- `/admin/artist/:id`, `/admin/album/:id`, `/admin/collection/:id`, `/admin/playlist/:id` — Admin edit pages (require admin)
- `/admin/upload`, `/admin/logs`, `/admin/new` — Admin upload, log viewer, entity creation (require admin)

**Layout** (`src/components/Layout.jsx`): Fixed header with `SearchBar`, active tag filter chip (links to `/tags/:name`, has clear button), and hamburger/user menu containing: home mode toggle (artists/albums), tag filter with autocomplete (fetches `getTags()` lazily when menu opens), and nav links. Scrollable `.main-content` div with pull-to-refresh (increments `refreshKey` to remount current page on pull ≥ 60px). Fixed footer with `NowPlaying` + `MusicPlayerWrapper`.

**Audio player**: `playerStore` (Zustand) is the single source of truth for all playback state and owns the transport logic (play/pause/seek/queue management). `usePlayerEngine(audioRef)` (`src/hooks/usePlayerEngine.js`) is the only code that touches the real `<audio>` DOM element — it binds the element into the store, bridges its events (`play`/`pause`/`waiting`/`timeupdate`/`ended`/etc.) to store actions, fires `apiService.log(id)` at the 5-second mark, and drives the Media Session API (feature-detected via `'mediaSession' in navigator`) for lock-screen/Bluetooth controls. `MusicPlayerWrapper` renders the `<audio>` element and transport controls from store state via `usePlayerEngine`; `PlaylistDrawer` renders the slide-out queue (drag-reorder on desktop, tap/scroll-disambiguating touch handling on mobile). Every component that wants to play audio calls `playerStore` actions directly (`addTrack`, `addTracks`, `clearPlaylist`, `playTrackAtIndex`, `setPlaylist`) — these actions internally decide whether to auto-start playback (callers never need to check "is anything playing").

**State management** (`src/stores/`): Four Zustand stores:
- `playerStore` — `audioElement`, `playlist`, `currentTrackIndex`, `currentTrack`, `isPlaying`, `isBuffering`, `currentTime`, `duration`, `playlistFinished`, `shuffle`, `shuffleHistory`, `drawerOpen`, `activityPulseToken`. `audioElement` is the live `<audio>` DOM node, bound in by `usePlayerEngine`.
- `authStore` — `user`, `isAuthenticated`, `isAdmin`, `loading`. Auth uses httpOnly cookie (set by backend). Calls `initialize()` on app start to check `/auth/me`. On login/init, populates `tagFilterStore` from `user.default_tag`.
- `tagFilterStore` — `activeTag` (persisted to `localStorage` as `tag-filter`). Tag filters the home feed and is shown as a chip in the header.
- `homeModeStore` — `mode` (`'artists'` | `'albums'`, persisted to `localStorage` as `home-mode`). Controls whether Home shows an artist grid or album grid.

**API** (`src/services/api.js`): Single axios instance. Base URL is `/api` in dev (proxied to `localhost:3000`) and `/bemused/api` in production. `withCredentials: true` for httpOnly cookie auth. Methods are grouped by domain: auth, artists, albums, tags, search, log, admin (artist/album/track/relation/image ops), upload, playlists, collections, image management. `apiService.getImageUrl(imagePath, context)` constructs absolute URLs at `https://patf.net/images/` (prod) or `/images` (dev) using context strings: `artist_search`, `artist_page`, `album_small`, `album_page`. `apiService.log(id)` fires at the 5-second mark of each track, tracked by `usePlayerEngine`.

**Pages** (`src/pages/`):
- `Home` — random artists or albums grid (controlled by `homeModeStore`), tag-filtered via `tagFilterStore`
- `Artist` (`/artist/:id`) — fetches `getArtist(id)` → `{ artist, summary, albums }`; clicking artist name reloads
- `Album` (`/album/:id`) — fetches `getAlbum(id)` → `{ artist, album, tracks, summary }`; clicking album title reloads
- `Search` (`/search?q=...`) — fetches `search(query)` → `{ artists, albums, tracks, playlists }`
- `Library` — user's personal library view
- `Playlists` — list all playlists
- `Playlist` — single playlist with track list
- `Collections` — list all collections
- `Collection` — single collection with album list
- `TagPage` — browse artists and albums tagged with a given tag
- `Login`, `Signup` — authentication forms
- `AdminArtist`, `AdminAlbum` — edit metadata, manage images and artist relations
- `AdminCollection`, `AdminPlaylist` — edit collection or playlist metadata and contents
- `AdminUpload` — upload audio files; polls upload queue status
- `AdminLogs` — paginated playback log viewer
- `AdminNew` — create new artist or album records

**Key components** (`src/components/`):
- `Track` — accepts `{ track, index, trackCount, includeMeta, isPlaying }`; `includeMeta=true` shows album/artist links (used in Search)
- `SearchBar` — search input, navigates to `/search?q=…`
- `NowPlaying` — current track display in footer
- `MusicPlayerWrapper` (`src/components/player/`) — renders the `<audio>` element and transport controls (play/pause/seek/next/prev/shuffle) from `playerStore` state via `usePlayerEngine`
- `PlaylistDrawer` (`src/components/player/`) — slide-out queue view; drag-reorder on desktop, tap/scroll-disambiguating touch handling on mobile, delete-per-row, activity overlay for just-added tracks
- `ProtectedRoute` — redirects to `/login` if not authenticated; `requireAdmin` prop also enforces admin role

**Styling**: Tailwind v4 (nominally) + custom CSS in `src/index.css`. CSS classes (`.app-header`, `.main-content`, `.app-footer`, `.artist-grid`, `.track-item`, `.now-playing`, etc.) are defined there. Fixed header/footer, 4.5em on desktop / `--mb` (currently `2.75rem`) on mobile. Many mobile overrides use `!important` due to competing inline styles on page components.

**Tailwind is installed but not actually wired into the build.** `src/index.css` uses v3-style `@tailwind base; @tailwind components; @tailwind utilities;` directives, but there's no `postcss.config.js` and no `@tailwindcss/postcss`/`@tailwindcss/vite` plugin in `vite.config.js` — confirmed by inspecting `dist/assets/*.css`, where those directives appear verbatim, unprocessed. Tailwind's preflight (the `*, ::before, ::after { box-sizing: border-box }` reset) has therefore never actually run; every element defaults to the browser's native `box-sizing: content-box` unless a rule sets it explicitly. Any custom CSS that combines an explicit `height`/`width` with `padding` (the safe-area-inset pattern below is the main offender) must set `box-sizing: border-box` itself — don't assume Tailwind's reset covers it. Fixing the Tailwind integration properly (so utility classes and preflight actually work) is a separate, codebase-wide task, not something to bundle into an unrelated fix.

**PWA / installed-app considerations** (P·Share is meant to be used as an iOS home-screen PWA, via `vite-plugin-pwa` — see `manifest`/`workbox` config in `vite.config.js`):
- **Safe-area insets only have real, non-zero values in standalone/installed mode.** In a normal mobile Safari tab `env(safe-area-inset-top/bottom)` resolve to `0` (the browser's own chrome already occupies that space); in the installed PWA (`display-mode: standalone`) they're real (~59px top / ~34px bottom on an iPhone with Dynamic Island). **A CSS bug that only manifests with non-zero insets will look perfectly fine in Safari and only break once installed to the home screen** — always verify layout changes around `.app-header`/`.app-footer`/`.music-player-playlist-container`/`.main-content` on the actual installed app, not just in mobile Safari or devtools device emulation (which also reports `0` insets).
- Mobile chrome height/inset math lives behind a single tunable custom property: `:root { --mb: 2.75rem; }` (inside the `@media (max-width: 768px)` block in `src/index.css`). `.app-header`/`.app-footer` compute `height: calc(var(--mb) + env(safe-area-inset-*))` and also set `padding: env(safe-area-inset-*)` so content clears the notch/home-indicator — this only avoids double-counting the inset under `box-sizing: border-box` (see above; this is exactly why that property had to be added explicitly).
- There's a separate `@supports (-webkit-touch-callout: none)` block with its own `.main-content` height override for iOS Safari quirks. Because it has the same selector specificity and `!important` as the mobile breakpoint's rule, **whichever one is later in the file wins outright** — if you edit the inset math in one, you must mirror it in the other, or remove the duplicate. A `@media (display-mode: standalone)` block also existed purely to handle `.app` height (`100vh`/`100dvh` fallback); it used to *also* override `.main-content` height with a stale hardcoded value, which was dead code in practice (shadowed by the `@supports` block) but still worth deleting rather than leaving as a trap.
- Service worker (`vite-plugin-pwa`, `registerType: 'autoUpdate'`, Workbox `generateSW`) precaches `index.html` and all built assets. In practice, an installed iOS PWA can still serve a stale precached shell after a deploy even following a force-quit + relaunch — when debugging "my fix isn't showing up," verify the *server* is serving the new build first (e.g. `curl` the deployed CSS/JS and diff against a local build) before assuming it's a caching problem on the phone.
- Safe-area inset math can't be meaningfully unit-tested in jsdom (it has no concept of `env()` or `display-mode`). Verify visually — a screenshot from the actual installed PWA, pixel-measured if needed, was what caught the box-sizing bug above (the `:active` pseudo-class doesn't reliably render either, on touch, since handlers often unmount the element before the transition can paint).

## Backend

**Entry point** (`server/src/index.ts`): Hono app on port 3000 (configurable via `PORT` env var). Global middleware: `cors` (all origins in dev; allowlist of patf.net/patf.com/172.16.1.10 in prod) and `authMiddleware` (extracts user from httpOnly `auth` cookie into `c.get('user')`). Admin routes mount a sub-app with `requireAdmin` guard.

**Route modules** (`server/src/routes/`):
- `auth` (`/auth`) — login, logout, signup, `/auth/me`, default-tag update
- `artists` (`/artists`, `/artist`) — list, random (tag-filterable), detail; singular alias used by frontend
- `albums` (`/albums`, `/album`) — list, random (tag-filterable), detail; singular alias
- `search` (`/search`) — full-text search across artists, albums, tracks, playlists
- `streams` (`/stream`) — audio file streaming
- `logs` (`/log`) — playback event logging; admin log viewer
- `playlists` (`/playlist`, `/playlists`, `/top`, `/newborns`, `/surprise`) — playlist CRUD and auto-generated views
- `collections` (`/collection`, `/collections`) — collection CRUD
- `tags` (`/tags`) — tag CRUD; `/tags/:name/content` for tag browse
- `admin` (`/admin`) — artist/album/track admin ops, image download, artist relations, stub merging (protected by `requireAdmin`)
- `upload` (`/admin/upload`) — multipart file upload (2GB body limit); inserts to `upload_queue` and returns immediately; processing deferred to worker

**Database** (`server/src/db/database.ts`): Kysely with `pg.Pool` (max 10 connections). Connection string from `BEMUSED_DB` env var. Tables:
- `artists` — name, image path, Wikipedia text, MusicBrainz ID + confidence + status
- `albums` — title, artist FK, year, disc number, genre, image path, Wikipedia, MusicBrainz metadata
- `tracks` — title, number, year, album/artist FKs, media file FK, Wikipedia, duration
- `media_files` — file system records linking audio files to entities; `entity_id`/`entity_type` for current records (`track_id` is legacy)
- `playlists` — named playlists with optional user ownership and auto-generated flag
- `playlist_tracks` — ordered join table for playlist ↔ track
- `logs` — playback events: track/album/artist IDs, action, IP, timestamp
- `favorites` — user ↔ entity favorites by kind (artist/album/track)
- `upload_queue` — pending/processing/completed/failed upload jobs with full file and metadata fields
- `users` — username, email, bcrypt password, admin flag, default_tag
- `user_playlists` — user ↔ playlist with role
- `artist_albums` — many-to-many artist ↔ album with role (primary/compilation/featured/guest/collaborator) and order
- `artist_relations` — similar/related artist pairs with source, similarity score, `is_hidden`, `force_show`
- `external_lookups` — cache of results from external service lookups (entity_type, entity_id, service)
- `images` — image records for artists/albums with source, status, dimensions, primary flag
- `collections` — named album collections
- `collection_albums` — ordered join table for collection ↔ album
- `tags` — tag names
- `albums_tags`, `artists_tags`, `tags_tracks` — many-to-many tag associations

**Auth** (`server/src/middleware/auth.ts`): JWT in httpOnly `auth` cookie, 24h expiry. `authMiddleware` runs globally and sets `c.get('user')` if cookie is valid. `requireAdmin` blocks non-admin users with 403. Passwords hashed with bcrypt.

**Upload flow**: `POST /admin/upload` accepts multipart (2GB body limit), writes files to a temp dir, inserts rows into `upload_queue` with `status: 'pending'`, returns immediately.

**Queue worker** (`server/src/workers/queue-handler.ts`): Run via `cd server && npm run worker` — a **separate process** from the API server, required for uploads to be processed. Polls `upload_queue` every 5 seconds for `pending` rows. For each: extracts ID3 tags, resolves or creates artist/album/track records, moves file to `$BEMUSED_UPLOAD_PATH/{artist}/{album}/{track}.mp3`, creates a `MediaFile` record, updates queue status to `completed` or `failed`. MBID lookup and similar-artist side effects run non-blocking.

**Migrations** (`server/migrations/`): 20 SQL files (`000`–`019`). Runner at `server/scripts/run-migrations.js` tracks applied migrations in `schema_migrations` table. Migrations run automatically on every backend deploy.

**External services** (`server/src/services/`): All calls are non-blocking; used by the worker and admin scripts:
- `musicbrainz` — MBID lookups for artists and albums
- `coverArtArchive` — album art from Cover Art Archive
- `fanart` — artist/album images from Fanart.tv
- `lastfm` — artist/album metadata from Last.fm
- `lastfmSimilar` — similar artist data from Last.fm
- `listenbrainzSimilar` — similar artists from ListenBrainz
- `wikipedia` — artist/album summaries from Wikipedia API
- `imageResize` — image resizing via `sharp`
