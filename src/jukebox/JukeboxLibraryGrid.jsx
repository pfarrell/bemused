import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import JukeboxPlaylistTile from './JukeboxPlaylistTile';
import JukeboxCollectionTile from './JukeboxCollectionTile';
import { useProfileFilterStore } from '../stores/profileFilterStore';

// Every playlist or collection as a tile grid, shown in the Browse drawer when
// the Playlists / Collections selector button is active (see SearchTab.jsx).
// Sorted A-Z by default; "Recent" orders by the server's last_activity (the
// later of last edit and last play, which the list endpoints supply).
// With a profile filter active, only matching playlists/collections are
// listed (a playlist by its own tags; a collection by its own tags or any
// matching album — decided server-side).
// A playlist can have a null name (one does in prod), so never call a string
// method on it directly - a throw here would blank the whole kiosk.
const byName = (a, b) => (a.name ?? '').localeCompare(b.name ?? '', undefined, { sensitivity: 'base' });
const activityOf = (item) => {
  const t = Date.parse(item.last_activity);
  return Number.isNaN(t) ? -Infinity : t;
};
const byRecent = (a, b) => activityOf(b) - activityOf(a) || byName(a, b);

const JukeboxLibraryGrid = ({ kind, onSelectPlaylist, onSelectCollection }) => {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(false);
  const [sort, setSort] = useState('name'); // 'name' | 'recent'
  const activeProfileId = useProfileFilterStore((s) => s.activeProfileId);

  const load = () => {
    setError(false);
    setItems(null);
    const request = kind === 'playlists' ? apiService.getPlaylists(activeProfileId) : apiService.getCollections(activeProfileId);
    request.then((response) => setItems(response.data)).catch(() => setError(true));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when the kind or profile filter changes
  }, [kind, activeProfileId]);

  if (error) {
    return (
      <div className="jukebox-panel-error">
        <p>{`Failed to load ${kind}.`}</p>
        <button type="button" onClick={load}>Retry</button>
      </div>
    );
  }
  if (items === null) return <div className="jukebox-panel-loading">Loading…</div>;
  if (items.length === 0) {
    return <p className="jukebox-panel-empty">{activeProfileId ? `No ${kind} match this profile` : `No ${kind} yet`}</p>;
  }

  const sorted = [...items].sort(sort === 'name' ? byName : byRecent);
  // A playlist/collection without its own cover falls back to its first album's.
  const imageFor = (item) => apiService.getImageUrl(item.image_path || item.preview_albums?.[0]?.image_path, 'album_small');

  return (
    <div className="jukebox-library">
      <div className="jukebox-library-sort" role="group" aria-label="Sort order">
        <button type="button" aria-pressed={sort === 'name'} onClick={() => setSort('name')}>A–Z</button>
        <button type="button" aria-pressed={sort === 'recent'} onClick={() => setSort('recent')}>Recent</button>
      </div>
      <div className="jukebox-album-grid">
        {sorted.map((item) => (kind === 'playlists' ? (
          <JukeboxPlaylistTile key={item.id} playlist={item} imageUrl={imageFor(item)} onSelect={onSelectPlaylist} />
        ) : (
          <JukeboxCollectionTile key={item.id} collection={item} imageUrl={imageFor(item)} onSelect={onSelectCollection} />
        )))}
      </div>
    </div>
  );
};

export default JukeboxLibraryGrid;
