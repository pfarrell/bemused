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
| `src/App.jsx` | Router config. `/login` has no layout; all other routes use `Layout`. Basename: `/` (dev) or `/bemused/app` (prod) via `import.meta.env.DEV` |
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
| `src/pages/Admin*.jsx` | Admin pages (AdminAlbum, AdminArtist, AdminUpload, etc.) |
| `src/pages/Playlist.jsx`, `Playlists.jsx` | Playlist views |
| `src/pages/Collection.jsx`, `Collections.jsx` | Collection views |
| `src/services/api.js` | Single axios instance. All API calls go through here. `apiService.getImageUrl(imagePath, context)` maps images to `https://patf.net/images/` |
| `src/stores/playerStore.js` | Zustand store: `currentTrack`, `playlist`, `isPlaying`, `playerInstance`, `currentTrackIndex` |
| `src/stores/authStore.js` | Zustand store: `user`, `isAuthenticated`, `isAdmin`. Token in `localStorage` as `authToken` |
| `src/stores/homeModeStore.js` | Home page display mode |
| `src/stores/tagFilterStore.js` | Tag filtering state |
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
- **axios** for HTTP — use the shared instance from `src/services/api.js`, not raw `fetch`.
- **React Router v7** — routes defined in `src/App.jsx`.
- **Audio player** — `window.AudioPlayer` is an external class from `public/player.js`. The `playerStore` holds the live instance as `playerInstance`.
- **Image URLs** — always use `apiService.getImageUrl(path, context)` to construct image URLs. Context strings: `artist_image`, `album_art`, etc.
- **No test framework** — there are no tests to run.
- **No CI/CD pipelines** — there are no GitHub Actions workflows. Validation is manual: `npm run lint` + `npm run build`.
