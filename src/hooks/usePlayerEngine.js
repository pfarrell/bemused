import { useEffect } from 'react';
import { usePlayerStore } from '../stores/playerStore';
import { apiService } from '../services/api';

const FALLBACK_ARTWORK = `${import.meta.env.BASE_URL}icons/icon-512.png`;

const setMediaSessionActionHandler = (action, handler) => {
  try {
    navigator.mediaSession.setActionHandler(action, handler);
  } catch {
    // Some browsers (notably Safari) throw for unsupported actions.
  }
};

export const usePlayerEngine = (audioRef) => {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    usePlayerStore.getState().setAudioElement(audio);

    let fiveSecondMarkFired = false;

    const handleTimeUpdate = () => {
      usePlayerStore.getState().setCurrentTime(audio.currentTime);
      if (audio.currentTime >= 5 && !fiveSecondMarkFired) {
        fiveSecondMarkFired = true;
        const track = usePlayerStore.getState().currentTrack;
        if (track) apiService.log(track.id);
      }
    };
    const handleLoadedMetadata = () =>
      usePlayerStore.getState().setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const handleBufferingStart = () => usePlayerStore.getState().setBuffering(true);
    const handleBufferingEnd = () => usePlayerStore.getState().setBuffering(false);
    const handlePlay = () => {
      fiveSecondMarkFired = false;
      usePlayerStore.getState().setIsPlaying(true);
    };
    const handlePause = () => usePlayerStore.getState().setIsPlaying(false);
    const handleEnded = () => usePlayerStore.getState().playNext();

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

    if ('mediaSession' in navigator) {
      setMediaSessionActionHandler('play', () => usePlayerStore.getState().togglePlayPause());
      setMediaSessionActionHandler('pause', () => usePlayerStore.getState().togglePlayPause());
      setMediaSessionActionHandler('previoustrack', () => usePlayerStore.getState().playPrev());
      setMediaSessionActionHandler('nexttrack', () => usePlayerStore.getState().playNext());
      setMediaSessionActionHandler('seekto', (details) => {
        if (details.seekTime != null) usePlayerStore.getState().seek(details.seekTime);
      });
    }

    return () => {
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
      if ('mediaSession' in navigator) {
        setMediaSessionActionHandler('play', null);
        setMediaSessionActionHandler('pause', null);
        setMediaSessionActionHandler('previoustrack', null);
        setMediaSessionActionHandler('nexttrack', null);
        setMediaSessionActionHandler('seekto', null);
      }
      usePlayerStore.getState().setAudioElement(null);
    };
  }, [audioRef]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    if (!currentTrack) {
      navigator.mediaSession.metadata = null;
      return;
    }
    const artworkUrl = currentTrack.image_path
      ? apiService.getImageUrl(currentTrack.image_path, 'album_small')
      : FALLBACK_ARTWORK;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist?.name || currentTrack.artist || '',
      album: currentTrack.album?.title || '',
      artwork: [{ src: artworkUrl, sizes: '512x512', type: 'image/png' }],
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
