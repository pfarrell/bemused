import { useState, useEffect, useRef } from 'react';
import { usePlayerStore } from '../../stores/playerStore';
import { apiService } from '../../services/api';

const isMobileDevice = () =>
  window.innerWidth <= 768 ||
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const formatTime = (seconds) => {
  if (!seconds || !Number.isFinite(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
};

const ActivityOverlay = ({ onDone }) => {
  useEffect(() => {
    const timer = setTimeout(onDone, 1200);
    return () => clearTimeout(timer);
  }, [onDone]);
  return <div className="track-item-activity-overlay" />;
};

const PlaylistDrawer = () => {
  const playlist = usePlayerStore((s) => s.playlist);
  const currentTrackIndex = usePlayerStore((s) => s.currentTrackIndex);
  const drawerOpen = usePlayerStore((s) => s.drawerOpen);
  const playTrackAtIndex = usePlayerStore((s) => s.playTrackAtIndex);
  const removeTrackFromPlaylist = usePlayerStore((s) => s.removeTrackFromPlaylist);
  const reorderPlaylist = usePlayerStore((s) => s.reorderPlaylist);
  const togglePlayPause = usePlayerStore((s) => s.togglePlayPause);
  const toggleDrawer = usePlayerStore((s) => s.toggleDrawer);

  const [draggedIndex, setDraggedIndex] = useState(null);
  const touchStartTimeRef = useRef(0);
  const touchStartPosRef = useRef({ x: 0, y: 0 });

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
    const target = insertAt > draggedIndex ? insertAt - 1 : insertAt;
    reorderPlaylist(draggedIndex, target);
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
                {track.__justAdded && (
                  <ActivityOverlay onDone={() => { delete track.__justAdded; }} />
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
};

export default PlaylistDrawer;
