# Copilot Agent Instructions for bemused_fe

Trust these instructions. Only search the repo if information here is incomplete or incorrect.

## Project Summary

**bemused_fe** is a personal music streaming service called "P·Share". This is a monorepo with two independent packages:

1. **Frontend (root `/`)** — React 19 SPA built with Vite 6, styled with Tailwind CSS v4, using Zustand for state management. Written in JavaScript (`.js`/`.jsx`).
2. **Backend (`server/`)** — Hono-based Node.js API server written in TypeScript, using Kysely ORM with PostgreSQL, with a background queue worker.

There are **no tests** in this project. There are **no GitHub Actions workflows or CI pipelines**.

## Build & Validate

### Frontend (run from repo root `/`)

```bash
npm install          # Always run before build or lint
npm run build        # Production build → outputs to dist/
npm run lint         # ESLint (flat config, JS/JSX only)
npm run dev          # Dev server on localhost:5173, proxies /api → localhost:3000
```

- Always run `npm install` before `npm run build` or `npm run lint`.
- `npm run build` sets `base` to `/bemused/app/` in production mode. In dev, base is `/`.
- `npm run lint` uses ESLint 9 flat config (`eslint.config.js`). Linting covers `**/*.{js,jsx}` and ignores `dist/`. The `no-unused-vars` rule ignores variables starting with uppercase or `_`.
- Validation: after any change, always run `npm run lint` and `npm run build` to confirm no errors.

### Backend (run from `server/`)

```bash
cd server
npm install          # Always run before build
npm run build        # TypeScript compile → dist/
npm run dev          # Dev server via tsx watch on src/index.ts
```

- The server requires a `.env` file (see `server/.env.example` for required vars including `BEMUSED_DB` PostgreSQL connection string).
- `npm run build` runs `tsc`. Check `server/tsconfig.json` for compiler options.

## Architecture & Key Files

### Frontend (root)

| Path | Purpose |
|---|---|
| `src/main.jsx` | Entry point, renders `<App />` |
| `src/App.jsx` | Router config. All routes render inside `Layout`. Basename: `/` (dev) or `/bemused/app` (prod) via `import.meta.env.DEV`. Routes: `/`, `/search`, `/login`, `/signup`, `/artist/:id`, `/album/:id`, `/library`, `/playlists`, `/playlist/:id`, `/collections`, `/collection/:id`, `/tags/:name`. Admin routes (require admin): `/admin/artist/:id`, `/admin/album/:id`, `/admin/collection/:id`, `/admin/playlist/:id`, `/admin/upload`, `/admin/logs`, `/admin/new` |
| `src/components/Layout.jsx` | Fixed header (SearchBar), scrollable main content, fixed footer (NowPlaying + player) |
| `src/components/NowPlaying.jsx` | Now-playing display in footer |
| `src/components/Track.jsx` | Track row component. Props: `{ track, index, trackCount, includeMeta, isPlaying }` |
| `src/components/player/` | Player-related components (MusicPlayerWrapper etc.) |
| `src/components/SearchBar.jsx` | Header search |
| `src/components/ArtistGrid.jsx` | Grid layout for artists |
| `src/components/AlbumCard.jsx`, `AlbumGrid.jsx` | Album display components |
| `src/pages/Home.jsx` | Landing page — random artists |
| `src/pages/Artist.jsx` | `/artist/:id` — artist detail with albums |
| `src/pages/Album.jsx` | `/album/:id` — album detail with tracks |
| `src/pages/Search.jsx` | `/search?q=...` — search results |
| `src/pages/Login.jsx`, `Signup.jsx` | Auth pages |
| `src/pages/Library.jsx` | `/library` — user's personal library |
| `src/pages/Playlists.jsx`, `Playlist.jsx` | `/playlists`, `/playlist/:id` — playlist list and detail |
| `src/pages/Collections.jsx`, `Collection.jsx` | `/collections`, `/collection/:id` — collection list and detail |
| `src/pages/TagPage.jsx` | `/tags/:name` — browse artists and albums by tag |
| `src/pages/AdminArtist.jsx`, `AdminAlbum.jsx` | Edit metadata, manage images and artist relations (admin) |
| `src/pages/AdminCollection.jsx`, `AdminPlaylist.jsx` | Edit collection or playlist contents (admin) |
| `src/pages/AdminUpload.jsx` | Upload audio files; polls upload queue status (admin) |
| `src/pages/AdminLogs.jsx` | Paginated playback log viewer (admin) |
| `src/pages/AdminNew.jsx` | Create new artist or album records (admin) |
| `src/services/api.js` | Single axios instance. All API calls go through here. `apiService.getImageUrl(imagePath, context)` maps images to `https://patf.net/images/` (prod) or `/images` (dev). Context strings: `artist_search`, `artist_page`, `album_small`, `album_page`. `apiService.log(id)` fires at the 5-second mark of each track |
| `src/stores/playerStore.js` | Zustand store: `currentTrack`, `playlist`, `isPlaying`, `playerInstance`, `currentTrackIndex` |
| `src/stores/authStore.js` | Zustand store: `user`, `isAuthenticated`, `isAdmin`. Auth uses httpOnly cookie (no localStorage token). On login/init, populates `tagFilterStore` from `user.default_tag` |
| `src/stores/homeModeStore.js` | Home page display mode (`'artists'` \| `'albums'`), persisted to `localStorage` as `home-mode` |
| `src/stores/tagFilterStore.js` | Active tag filter, persisted to `localStorage` as `tag-filter`; populated from `user.default_tag` on login |
| `src/components/ProtectedRoute.jsx` | Redirects to `/login` if not authenticated; `requireAdmin` prop also enforces admin role |
| `src/hooks/useInfiniteItems.js` | Infinite scroll hook |
| `src/utils/formatters.js` | Formatting helpers |
| `src/index.css` | All custom CSS classes (`.app-header`, `.main-content`, `.app-footer`, `.artist-grid`, `.track-item`, `.now-playing`, etc.) — Tailwind v4 + custom styles |
| `public/` | Static assets including `player.js` (external `window.AudioPlayer` class loaded at runtime) |

### Backend (server/)

| Path | Purpose |
|---|---|
| `server/src/index.ts` | Hono server entry point |
| `server/src/routes/` | API route handlers |
| `server/src/services/` | Business logic |
| `server/src/db/` | Kysely database setup and queries |
| `server/src/middleware/` | Auth and other middleware |
| `server/src/workers/` | Background queue worker |
| `server/src/types.ts` | Shared TypeScript types |
| `server/migrations/` | Database migrations (SQL) |
| `server/schema.sql` | Full database schema dump |
| `server/tsconfig.json` | TypeScript config |

### Config Files (root)

| File | Purpose |
|---|---|
| `vite.config.js` | Vite config — proxy `/api` → `localhost:3000`, prod base `/bemused/app/` |
| `eslint.config.js` | ESLint 9 flat config with react-hooks and react-refresh plugins |
| `tailwind.config.js` | Tailwind content paths: `index.html` + `src/**/*.{js,ts,jsx,tsx}` |
| `index.html` | SPA entry HTML |
| `package.json` | Frontend deps and scripts |

## Key Conventions

- **No TypeScript in frontend** — all frontend code is `.js`/`.jsx`. Do not add `.ts`/`.tsx` files to `src/`.
- **Tailwind v4** — use Tailwind utility classes. Custom CSS classes are defined in `src/index.css`.
- **Zustand** for state — no Redux, no Context API for global state.
- **axios** for HTTP — use the shared instance from `src/services/api.js`, not raw `fetch`. Base URL is `/api` (dev) or `/bemused/api` (prod). `withCredentials: true` for httpOnly cookie auth.
- **React Router v7** — routes defined in `src/App.jsx`.
- **Audio player** — `window.AudioPlayer` is an external class from `public/player.js`. The `playerStore` holds the live instance as `playerInstance`.
- **Image URLs** — always use `apiService.getImageUrl(path, context)` to construct image URLs. Context strings: `artist_image`, `album_art`, etc.
- **No test framework** — there are no tests to run.
- **No CI/CD pipelines** — there are no GitHub Actions workflows. Validation is manual: `npm run lint` + `npm run build`.
