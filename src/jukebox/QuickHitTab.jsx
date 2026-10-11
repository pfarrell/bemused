import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import JukeboxAlbumTile from './JukeboxAlbumTile';
import JukeboxPlaylistTile from './JukeboxPlaylistTile';
import JukeboxCollectionTile from './JukeboxCollectionTile';

const GRID_SIZE = 20;

// Newest first; an entry without a usable last_played sorts last rather than
// breaking the comparison.
const timeOf = (item) => {
  const t = Date.parse(item.last_played);
  return Number.isNaN(t) ? -Infinity : t;
};

const merge = (albums, playlists, collections) =>
  [
    ...albums.map((data) => ({ kind: 'album', data })),
    ...playlists.map((data) => ({ kind: 'playlist', data })),
    ...collections.map((data) => ({ kind: 'collection', data })),
  ]
    .sort((a, b) => timeOf(b.data) - timeOf(a.data))
    .slice(0, GRID_SIZE);

// A plain vertical grid of tiles, recently played albums, playlists and
// collections mixed by time: tapping one drills into it via onSelectAlbum /
// onSelectPlaylist / onSelectCollection (owned by JukeboxBrowsePanel, same as
// a search result's tap). Rendered inside the Recent drawer (see
// JukeboxRecentsPanel.jsx), which owns the vertical scrolling - there is
// deliberately no scroller here.
const QuickHitTab = ({ onSelectAlbum, onSelectPlaylist, onSelectCollection, profileId = null }) => {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(false);

  const load = () => {
    setError(false);
    setItems(null);
    // A failed playlists or collections request must never take the albums down with it,
    // so only the albums request drives the error state.
    const playlistsRequest = apiService.getRecentPlaylists(GRID_SIZE)
      .then((response) => response.data)
      .catch(() => []);
    const collectionsRequest = apiService.getRecentCollections(GRID_SIZE)
      .then((response) => response.data)
      .catch(() => []);
    Promise.all([apiService.getRecentAlbums(GRID_SIZE, profileId).then((response) => response.data), playlistsRequest, collectionsRequest])
      .then(([albums, playlists, collections]) => setItems(merge(albums, playlists, collections)))
      .catch(() => setError(true));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  if (error) {
    return (
      <div className="jukebox-panel-error">
        <p>Failed to load albums.</p>
        <button onClick={load}>Retry</button>
      </div>
    );
  }

  if (items === null) {
    return <div className="jukebox-panel-loading">Loading…</div>;
  }

  if (items.length === 0) {
    return <p className="jukebox-panel-empty">Nothing played yet</p>;
  }

  return (
    <div className="jukebox-album-grid">
      {items.map(({ kind, data }) => (kind === 'album' ? (
        <JukeboxAlbumTile
          key={`album-${data.id}`}
          album={data}
          imageUrl={apiService.getImageUrl(data.image_path, 'album_small')}
          onSelect={onSelectAlbum}
        />
      ) : kind === 'collection' ? (
        <JukeboxCollectionTile
          key={`collection-${data.id}`}
          collection={data}
          imageUrl={apiService.getImageUrl(data.image_path, 'album_small')}
          onSelect={onSelectCollection}
        />
      ) : (
        <JukeboxPlaylistTile
          key={`playlist-${data.id}`}
          playlist={data}
          imageUrl={apiService.getImageUrl(data.image_path, 'album_small')}
          onSelect={onSelectPlaylist}
        />
      )))}
    </div>
  );
};

export default QuickHitTab;
