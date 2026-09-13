import { useEffect, useRef } from 'react';
import { usePlayerStore, COLLECTION_SHUFFLE_BATCH_SIZE, COLLECTION_SHUFFLE_TOPUP_REMAINING } from '../stores/playerStore';
import { useTabTitleStore } from '../stores/tabTitleStore';
import { apiService } from '../services/api';
import { useAuthStore } from '../stores/authStore';

const FALLBACK_ARTWORK = `${import.meta.env.BASE_URL}icons/icon-512.png`;
const PREFETCH_THRESHOLD_SECONDS = 15;
const DEFAULT_TITLE = 'P·Share';

const ARTWORK_MIME_TYPES = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
};

// Cover art filenames come verbatim from external sources (Cover Art Archive, Fanart.tv,
// embedded ID3 art) with whatever extension they shipped with — usually .jpg, not .png.
// A MediaMetadata artwork `type` that doesn't match the real file can make WebKit silently
// drop the artwork, so derive it from the URL instead of assuming PNG.
const mimeTypeForArtworkUrl = (url) => {
  const ext = /\.([a-z0-9]+)(?:[?#].*)?$/i.exec(url)?.[1]?.toLowerCase();
  return ext ? ARTWORK_MIME_TYPES[ext] : undefined;
};

const setMediaSessionActionHandler = (action, handler) => {
  try {
    navigator.mediaSession.setActionHandler(action, handler);
  } catch {
    // Some browsers (notably Safari) throw for unsupported actions.
  }
};

export const usePlayerEngine = (audioRefA, audioRefB) => {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const nextTrackIndex = usePlayerStore((s) => s.nextTrackIndex);
  const playlistFinished = usePlayerStore((s) => s.playlistFinished);
  const collectionContext = usePlayerStore((s) => s.collectionContext);
  const playbackMode = usePlayerStore((s) => s.playbackMode);
  const playlist = usePlayerStore((s) => s.playlist);
  const currentTrackIndex = usePlayerStore((s) => s.currentTrackIndex);
  const titleOverride = useTabTitleStore((s) => s.override);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const audioA = audioRefA.current;
    const audioB = audioRefB.current;
    if (!audioA || !audioB) return undefined;

    usePlayerStore.getState().setAudioElement('a', audioA);
    usePlayerStore.getState().setAudioElement('b', audioB);

    let fiveSecondMarkFired = false;
    const isActive = (audio) => usePlayerStore.getState().getActiveAudio() === audio;

    const handleTimeUpdate = (event) => {
      const audio = event.target;
      if (!isActive(audio)) return;
      usePlayerStore.getState().setCurrentTime(audio.currentTime);
      if (audio.currentTime >= 5 && !fiveSecondMarkFired) {
        fiveSecondMarkFired = true;
        const track = usePlayerStore.getState().currentTrack;
        if (track && isAuthenticated) apiService.log(track.id).catch(() => {});
      }
      if (Number.isFinite(audio.duration) && audio.duration - audio.currentTime <= PREFETCH_THRESHOLD_SECONDS) {
        usePlayerStore.getState().ensureStandbyLoaded();
      }
    };
    const handleLoadedMetadata = (event) => {
      if (!isActive(event.target)) return;
      usePlayerStore.getState().setDuration(Number.isFinite(event.target.duration) ? event.target.duration : 0);
    };
    const handleBufferingStart = (event) => {
      if (!isActive(event.target)) return;
      usePlayerStore.getState().setBuffering(true);
    };
    const handleBufferingEnd = (event) => {
      if (!isActive(event.target)) return;
      usePlayerStore.getState().setBuffering(false);
    };
    const handlePlay = (event) => {
      const audio = event.target;
      if (!isActive(audio)) {
        // Only the active element is ever allowed to be audibly playing. A stray 'play' here —
        // a bug in a call site, a race between rapid skips, or the iOS silent-unlock clip — is
        // paused immediately rather than trusting every call site to remember to do it.
        audio.pause();
        return;
      }
      fiveSecondMarkFired = false;
      usePlayerStore.getState().setIsPlaying(true);
    };
    const handlePause = (event) => {
      if (!isActive(event.target)) return;
      usePlayerStore.getState().setIsPlaying(false);
    };
    const handleEnded = (event) => {
      if (!isActive(event.target)) return;
      usePlayerStore.getState().playNext();
    };

    [audioA, audioB].forEach((audio) => {
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('loadstart', handleBufferingStart);
      audio.addEventListener('waiting', handleBufferingStart);
      audio.addEventListener('playing', handleBufferingEnd);
      audio.addEventListener('canplay', handleBufferingEnd);
      audio.addEventListener('error', handleBufferingEnd);
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('ended', handleEnded);
    });

    if ('mediaSession' in navigator) {
      setMediaSessionActionHandler('play', () => usePlayerStore.getState().togglePlayPause());
      setMediaSessionActionHandler('pause', () => usePlayerStore.getState().togglePlayPause());
      setMediaSessionActionHandler('previoustrack', () => usePlayerStore.getState().playPrev());
      setMediaSessionActionHandler('nexttrack', () => usePlayerStore.getState().playNext({ manual: true }));
      setMediaSessionActionHandler('seekto', (details) => {
        if (details.seekTime != null) usePlayerStore.getState().seek(details.seekTime);
      });
    }

    return () => {
      [audioA, audioB].forEach((audio) => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('loadstart', handleBufferingStart);
        audio.removeEventListener('waiting', handleBufferingStart);
        audio.removeEventListener('playing', handleBufferingEnd);
        audio.removeEventListener('canplay', handleBufferingEnd);
        audio.removeEventListener('error', handleBufferingEnd);
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('ended', handleEnded);
      });
      if ('mediaSession' in navigator) {
        setMediaSessionActionHandler('play', null);
        setMediaSessionActionHandler('pause', null);
        setMediaSessionActionHandler('previoustrack', null);
        setMediaSessionActionHandler('nexttrack', null);
        setMediaSessionActionHandler('seekto', null);
      }
      usePlayerStore.getState().setAudioElement('a', null);
      usePlayerStore.getState().setAudioElement('b', null);
    };
  }, [audioRefA, audioRefB]);

  // Re-targets the prefetch if a playlist mutation changes what "next" resolves to while we're
  // already within the prefetch window — e.g. reordering or removing a track from the queue, or
  // cycling the playback mode, in the last 15s of the current track.
  useEffect(() => {
    const audio = usePlayerStore.getState().getActiveAudio();
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
    if (audio.duration - audio.currentTime <= PREFETCH_THRESHOLD_SECONDS) {
      usePlayerStore.getState().ensureStandbyLoaded();
    }
  }, [nextTrackIndex]);

  // When an album played from a collection (see Album.jsx's setCollectionContext)
  // runs all the way out — nextTrackIndex resolved to -1, so playNext() gave up and
  // set playlistFinished — pull in the collection's next album and keep playing,
  // rather than just stopping. Lives here rather than in the store because it needs
  // apiService, and this hook (mounted outside <Routes> in App.jsx) keeps running no
  // matter which page is shown, so it survives navigating away mid-album.
  useEffect(() => {
    if (!playlistFinished || !collectionContext) return undefined;
    let cancelled = false;
    const { collectionId, albumId } = collectionContext;
    apiService.getAdjacentAlbums(albumId, collectionId)
      .then((response) => {
        const next = response.data?.next;
        if (!next || cancelled) return undefined;
        return apiService.getAlbum(next.id).then((albumResponse) => {
          if (cancelled) return;
          const tracks = albumResponse.data?.tracks || [];
          if (tracks.length === 0) return;
          usePlayerStore.getState().addTracks(tracks, false, { playImmediately: true });
          usePlayerStore.getState().setCollectionContext({ collectionId, albumId: next.id });
        });
      })
      .catch((error) => console.error('Failed to auto-advance to next collection album:', error));
    return () => { cancelled = true; };
  }, [playlistFinished, collectionContext]);

  // Keeps Shuffle Collection's queue topped up: once only a few unplayed tracks remain, fetch
  // another random batch from the same collection and append it, so playback never has to stop
  // and wait on a fetch. Re-runs whenever the queue or current position changes, and naturally
  // stops re-fetching once `remaining` grows past the threshold again after a batch lands.
  const collectionShuffleFetchInFlight = useRef(false);
  useEffect(() => {
    if (playbackMode !== 'shuffle-collection' || !collectionContext) return;
    if (collectionShuffleFetchInFlight.current) return;
    const remaining = playlist.length - 1 - currentTrackIndex;
    if (remaining > COLLECTION_SHUFFLE_TOPUP_REMAINING) return;
    collectionShuffleFetchInFlight.current = true;
    apiService.getRandomCollectionTracks(collectionContext.collectionId, {
      limit: COLLECTION_SHUFFLE_BATCH_SIZE,
      excludeTrackIds: playlist.map((t) => t.id),
    })
      .then((response) => {
        usePlayerStore.getState().appendCollectionShuffleTracks(response.data?.tracks || []);
      })
      .catch((error) => console.error('Failed to top up collection shuffle queue:', error))
      .finally(() => { collectionShuffleFetchInFlight.current = false; });
  }, [playbackMode, collectionContext, playlist, currentTrackIndex]);

  useEffect(() => {
    if (titleOverride) {
      document.title = titleOverride;
      return undefined;
    }
    if (!currentTrack) {
      document.title = DEFAULT_TITLE;
      return undefined;
    }
    const artist = currentTrack.artist?.name;
    document.title = artist ? `${currentTrack.title} — ${artist}` : currentTrack.title;
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [currentTrack, titleOverride]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    if (!currentTrack) {
      navigator.mediaSession.metadata = null;
      return;
    }
    const artworkUrl = currentTrack.image_path
      ? apiService.getImageUrl(currentTrack.image_path, 'album_small')
      : FALLBACK_ARTWORK;
    const artworkType = mimeTypeForArtworkUrl(artworkUrl);
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist?.name || '',
      album: currentTrack.album?.title || '',
      artwork: [{ src: artworkUrl, sizes: '512x512', ...(artworkType ? { type: artworkType } : {}) }],
    });
  }, [currentTrack]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    if (duration > 0 && typeof navigator.mediaSession.setPositionState === 'function') {
      try {
        navigator.mediaSession.setPositionState({ duration, position: Math.min(currentTime, duration), playbackRate: 1 });
      } catch {
        // Some browsers expose mediaSession without full setPositionState support.
      }
    }
  }, [isPlaying, currentTime, duration]);
};
