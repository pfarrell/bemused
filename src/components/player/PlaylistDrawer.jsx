import { useState, useEffect, useRef } from 'react';
import { usePlayerStore } from '../../stores/playerStore';
import { apiService } from '../../services/api';
import { isMobileDevice } from '../../utils/device';

const formatTime = (seconds) => {
  if (!seconds || !Number.isFinite(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
};

// CSS's own animation (activity-row-flash, 0.6s x2) self-terminates the
// visual fade — this component has no timing logic of its own.
const ActivityOverlay = () => <div className="track-item-activity-overlay" />;

const PlaylistDrawer = () => {
  const playlist = usePlayerStore((s) => s.playlist);
  const currentTrackIndex = usePlayerStore((s) => s.currentTrackIndex);
  const drawerOpen = usePlayerStore((s) => s.drawerOpen);
  const playTrackAtIndex = usePlayerStore((s) => s.playTrackAtIndex);
  const removeTrackFromPlaylist = usePlayerStore((s) => s.removeTrackFromPlaylist);
  const reorderPlaylist = usePlayerStore((s) => s.reorderPlaylist);
  const togglePlayPause = usePlayerStore((s) => s.togglePlayPause);
  const toggleDrawer = usePlayerStore((s) => s.toggleDrawer);
  const recentlyAddedIndices = usePlayerStore((s) => s.recentlyAddedIndices);
  const clearRecentlyAdded = usePlayerStore((s) => s.clearRecentlyAdded);

  const [draggedIndex, setDraggedIndex] = useState(null);
  const touchStartTimeRef = useRef(0);
  const touchStartPosRef = useRef({ x: 0, y: 0 });
  // This component never unmounts (MusicPlayerWrapper always renders it; the
  // `if (!drawerOpen) return null` below is the only thing hiding it), so
  // "first open after an edit" has to be detected via the drawerOpen
  // transition, not mount/unmount — snapshot the batch when it opens, then
  // clear the store so a later open/close cycle shows no flash. Matched by
  // playlist position, not track id — the same track can appear twice.
  const [flashIndices, setFlashIndices] = useState([]);
  useEffect(() => {
    if (!drawerOpen) return;
    setFlashIndices(recentlyAddedIndices);
    if (recentlyAddedIndices.length > 0) clearRecentlyAdded();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the drawerOpen transition, not every recentlyAddedIndices change
  }, [drawerOpen]);

  if (!drawerOpen) return null;

  const mobile = isMobileDevice();

  const handleRowActivate = (index) => {
    if (index === currentTrackIndex) {
      togglePlayPause();
    } else {
      playTrackAtIndex(index);
    }
  };

  const handleTouchStart = (e) => {
    touchStartTimeRef.current = Date.now();
    touchStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (index) => (e) => {
    // A tap on the delete button is handled by its own click handler, not
    // row activation — otherwise the bubbled touchend plays the track first,
    // which then blocks the delete (a track can't be removed while playing).
    if (e.target.closest('.track-delete-button')) return;
    const duration = Date.now() - touchStartTimeRef.current;
    const dx = Math.abs(e.changedTouches[0].clientX - touchStartPosRef.current.x);
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartPosRef.current.y);
    // Tap, not a scroll: short press, finger barely moved.
    if (duration < 300 && dx < 10 && dy < 10) {
      e.preventDefault();
      handleRowActivate(index);
    }
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const insertAt = e.clientY > midpoint ? index + 1 : index;
    reorderPlaylist(draggedIndex, insertAt);
    setDraggedIndex(null);
  };

  return (
    <>
      <div className="playlist-backdrop" onClick={toggleDrawer} />
      <div className="music-player-playlist-container">
        <ul className="playlist">
          {playlist.map((track, index) => {
            const isActive = index === currentTrackIndex;
            const imageUrl = track.image_path ? apiService.getImageUrl(track.image_path, 'album_small') : null;
            const artSize = mobile ? 32 : 40;
            return (
              <li
                key={`${track.id}-${index}`}
                className={`track-item ${isActive ? 'active' : ''} ${draggedIndex === index ? 'dragging' : ''}`}
                draggable={!mobile}
                onDragStart={() => setDraggedIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDragEnd={() => setDraggedIndex(null)}
                onDrop={(e) => handleDrop(e, index)}
                onClick={!mobile ? () => handleRowActivate(index) : undefined}
                onTouchStart={mobile ? handleTouchStart : undefined}
                onTouchEnd={mobile ? handleTouchEnd(index) : undefined}
              >
                {imageUrl ? (
                  <img className="playlist-track-art" src={imageUrl} alt={track.title} style={{ width: artSize, height: artSize }} />
                ) : (
                  <div className="playlist-track-art-blank" style={{ width: artSize, height: artSize }} />
                )}
                <span className="track-text">
                  {index + 1}. {track.title} - {track.artist?.name} ({formatTime(track.duration)})
                </span>
                <button
                  className="track-delete-button"
                  aria-label="Remove track from playlist"
                  title="Remove from playlist"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTrackFromPlaylist(index);
                  }}
                >
                  &#10060;
                </button>
                {flashIndices.includes(index) && <ActivityOverlay />}
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
};

export default PlaylistDrawer;
