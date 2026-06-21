import { useRef, useEffect, useState } from 'react';
import { usePlayerStore } from '../../stores/playerStore';
import { usePlayerEngine } from '../../hooks/usePlayerEngine';
import PlaylistDrawer from './PlaylistDrawer';

const HAMBURGER = '☰';
const PREV = '⏪';
const NEXT = '⏩';
const SHUFFLE = '\u{1F500}';
const PLAY = '⏵';
const PAUSE = '⏸';

const formatTime = (seconds) => {
  if (!seconds || !Number.isFinite(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
};

const MusicPlayerWrapper = ({ className = '' }) => {
  const audioRefA = useRef(null);
  const audioRefB = useRef(null);
  usePlayerEngine(audioRefA, audioRefB);

  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isBuffering = usePlayerStore((s) => s.isBuffering);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const drawerOpen = usePlayerStore((s) => s.drawerOpen);
  const activityPulseToken = usePlayerStore((s) => s.activityPulseToken);
  const togglePlayPause = usePlayerStore((s) => s.togglePlayPause);
  const playNext = usePlayerStore((s) => s.playNext);
  const playPrev = usePlayerStore((s) => s.playPrev);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const toggleDrawer = usePlayerStore((s) => s.toggleDrawer);
  const seek = usePlayerStore((s) => s.seek);

  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    if (activityPulseToken === 0) return undefined;
    setPulsing(false);
    const frame = requestAnimationFrame(() => setPulsing(true));
    const stop = setTimeout(() => setPulsing(false), 1200);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(stop);
    };
  }, [activityPulseToken]);

  const handleSeek = (e) => {
    const percent = Number(e.target.value) / 100;
    seek(percent * duration);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`music-player-wrapper ${className}`}>
      <audio ref={audioRefA} style={{ display: 'none' }} preload="metadata" />
      <audio ref={audioRefB} style={{ display: 'none' }} preload="metadata" />

      <div className="player-controls-container">
        <div className="player-controls-wrapper">
          <button
            className={`player-btn hamburger-btn ${drawerOpen ? 'active' : ''} ${pulsing ? 'activity-pulse' : ''}`}
            title="Toggle Playlist"
            onClick={toggleDrawer}
          >
            {HAMBURGER}
          </button>

          <span className="time-display elapsed">{formatTime(currentTime)}</span>

          <div className={`progress-bar-wrapper ${isBuffering ? 'loading' : ''}`}>
            <input
              type="range"
              min="0"
              max="100"
              value={progressPercent}
              className="progress-bar"
              onChange={handleSeek}
            />
            <div className="progress-bar-loading-overlay" />
          </div>

          <span className="time-display total">{formatTime(duration)}</span>

          <button className="player-btn prev-btn" title="Previous" onClick={playPrev}>{PREV}</button>
          <button className="player-btn play-btn" title="Play/Pause" onClick={togglePlayPause}>
            {isPlaying ? PAUSE : PLAY}
          </button>
          <button className="player-btn next-btn" title="Next" onClick={playNext}>{NEXT}</button>
          <button
            className={`player-btn shuffle-btn ${shuffle ? 'active' : ''}`}
            title="Shuffle"
            onClick={toggleShuffle}
          >
            {SHUFFLE}
          </button>
        </div>
      </div>

      <PlaylistDrawer />
    </div>
  );
};

export default MusicPlayerWrapper;
