// src/pages/TrackPage.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { usePlayerStore } from '../stores/playerStore';
import { useAuthStore } from '../stores/authStore';
import Track from '../components/Track';
import PlayButton from '../components/PlayButton';
import Loading from '../components/Loading';
import { formatDuration } from '../utils/formatters';
import { shareLink } from '../utils/shareLink';

const TrackPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuthStore();
  const clearPlaylist = usePlayerStore((s) => s.clearPlaylist);
  const addTrack = usePlayerStore((s) => s.addTrack);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const setPageTracks = usePlayerStore((s) => s.setPageTracks);
  const [track, setTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiService.getTrack(id)
      .then((response) => {
        if (!cancelled) setTrack(response.data.track);
      })
      .catch((err) => {
        console.error('Error fetching track data:', err);
        if (!cancelled) setError('Failed to load track');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    // Lets the footer play button fall back to "Play Now" behavior when the
    // playlist is empty, matching Album.jsx/Artist.jsx's usage of setPageTracks.
    setPageTracks(track ? [track] : []);
    return () => setPageTracks([]);
  }, [track, setPageTracks]);

  const handlePlayNow = () => {
    if (!track) return;
    clearPlaylist();
    addTrack(track);
  };

  const handleShare = () => {
    if (!track) return;
    shareLink({
      title: track.title,
      text: track.artist?.name ? `${track.title} — ${track.artist.name}` : track.title,
    });
  };

  if (loading) {
    return <Loading message="Loading track" />;
  }

  if (error || !track) {
    return (
      <div className="loading-container">
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#ef4444', fontSize: '1.25rem' }}>{error || 'Track not found'}</p>
          <button
            onClick={() => navigate('/')}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const isPlaying = Boolean(currentTrack && currentTrack.id === track.id);

  return (
    <div style={{ padding: '.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div className="media-page-header">
        <div style={{ flexShrink: 0 }}>
          <img
            src={apiService.getImageUrl(track.image_path, 'album_page')}
            alt={track.title}
            className="full-image"
          />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0 0 0.5rem 0', color: 'var(--color-text-primary)' }}>
            {track.title}
          </h1>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'normal', margin: '0 0 0.5rem 0', color: '#3b82f6' }}>
            {track.artist?.id ? (
              <span style={{ cursor: 'pointer' }} onClick={() => navigate(`/artist/${track.artist.id}`)}>
                {track.artist.name}
              </span>
            ) : track.artist?.name}
            {track.album?.id && (
              <>
                {' — '}
                <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate(`/album/${track.album.id}`)}>
                  {track.album.title}
                </span>
              </>
            )}
          </h2>
          {track.duration ? (
            <p style={{ color: 'var(--color-text-muted)', margin: '0 0 1rem 0' }}>{formatDuration(track.duration)}</p>
          ) : null}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {/* aria-label is the plain 'Play' rather than `Play ${track.title}` —
                the Track row rendered below already uses that exact label for
                its own play button, and two buttons with the same accessible
                name on one page are indistinguishable to assistive tech (and
                to a testing-library query). */}
            <PlayButton
              size={48}
              active={isPlaying}
              onClick={handlePlayNow}
              aria-label={isPlaying ? 'Now playing' : 'Play'}
            />
            <button
              onClick={handleShare}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}
              aria-label="Share"
            >
              📤
            </button>
          </div>
        </div>
      </div>

      <div style={{
        backgroundColor: 'var(--color-bg-surface)',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        overflowX: 'hidden',
        overflowY: 'visible',
        marginTop: '1rem',
      }}>
        <Track track={track} index={0} trackCount={1} isPlaying={isPlaying} showEdit={isAdmin} />
      </div>
    </div>
  );
};

export default TrackPage;
