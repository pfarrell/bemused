// Full-screen, hands-free voice control for the car: tap anywhere, say
// "play album Kind of Blue", hear it confirmed. Portaled to <body> as a fixed
// overlay above the header and player bar (which stay mounted underneath so
// playback is never interrupted by entering or leaving) — Layout's
// pull-to-refresh wrapper has a transform, which would otherwise pin a fixed
// child to that wrapper instead of the viewport.

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../stores/playerStore';
import { useProfileFilterStore } from '../stores/profileFilterStore';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { parseSearchCommand, runSearchCommand } from '../utils/searchCommands';
import { playChime, speakText } from '../utils/speech';
import { apiService } from '../services/api';

// iOS releases a wake lock whenever the page is hidden, so re-request it each
// time drive mode becomes visible again.
const useWakeLock = () => {
  useEffect(() => {
    if (!('wakeLock' in navigator)) return undefined;
    let lock = null;
    let cancelled = false;
    const acquire = async () => {
      try {
        const next = await navigator.wakeLock.request('screen');
        if (cancelled) next.release();
        else lock = next;
      } catch (err) {
        console.error('Wake lock failed:', err);
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') acquire();
    };
    acquire();
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      lock?.release();
    };
  }, []);
};

const DriveMode = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const activeProfileId = useProfileFilterStore((s) => s.activeProfileId);
  const [working, setWorking] = useState(false);
  // Whether we paused playback for this listening session, so a miss can put
  // it back without starting music that wasn't playing.
  const pausedRef = useRef(false);

  useWakeLock();

  const resume = () => {
    if (!pausedRef.current) return;
    pausedRef.current = false;
    usePlayerStore.getState().getActiveAudio()?.play().catch((err) => console.error('Playback failed:', err));
  };

  const handleHeard = async (text) => {
    if (!text.trim()) {
      speakText("I didn't catch that");
      resume();
      return;
    }
    const command = parseSearchCommand(text);
    if (!command) {
      speakText('Say play, then artist, album, playlist, or collection');
      resume();
      return;
    }
    setWorking(true);
    try {
      // Stay in drive mode instead of following the command to the match's page.
      const result = await runSearchCommand(command, { profileId: activeProfileId, navigate: () => {} });
      if (result.status !== 'playing') resume();
      else pausedRef.current = false;
    } finally {
      setWorking(false);
    }
  };

  const { supported, listening, transcript, start, stop } = useSpeechRecognition({ onEnd: handleHeard });

  const handleTap = () => {
    if (working) return;
    if (listening) {
      stop();
      return;
    }
    if (!supported) {
      speakText("Voice control isn't available in this browser");
      return;
    }
    const player = usePlayerStore.getState();
    // Still inside the tap: the command's playback starts after a search
    // round-trip, by which point iOS no longer counts it as a user gesture.
    player.unlockForGesture();
    const audio = player.getActiveAudio();
    if (audio && !audio.paused) {
      audio.pause();
      pausedRef.current = true;
    }
    playChime();
    start();
  };

  const exit = useCallback(() => {
    // 'default' means drive mode was the first page loaded — nothing to go back to.
    if (location.key === 'default') navigate('/');
    else navigate(-1);
  }, [location.key, navigate]);

  const artUrl = currentTrack?.image_path ? apiService.getImageUrl(currentTrack.image_path, 'album_page') : null;
  const micLabel = working ? 'Working…' : listening ? 'Listening…' : 'Tap to speak';

  return createPortal(
    <div className="drive-mode">
      <button type="button" className="drive-mode-exit" aria-label="Exit drive mode" onClick={exit}>
        ✕
      </button>
      <div className="drive-mode-now-playing" onClick={handleTap}>
        {artUrl && <img className="drive-mode-art" src={artUrl} alt={currentTrack.album?.title ?? ''} />}
        <div className="drive-mode-track">
          {currentTrack ? (
            <>
              <div className="drive-mode-title">{currentTrack.title ?? ''}</div>
              <div className="drive-mode-artist">{currentTrack.artist?.name ?? ''}</div>
            </>
          ) : (
            <div className="drive-mode-title">Nothing playing</div>
          )}
        </div>
      </div>
      <button
        type="button"
        className={`drive-mode-mic${listening ? ' listening' : ''}`}
        onClick={handleTap}
      >
        <span className="drive-mode-mic-icon" aria-hidden="true">🎤</span>
        <span>{micLabel}</span>
        {listening && transcript && <span className="drive-mode-transcript">{transcript}</span>}
      </button>
    </div>,
    document.body,
  );
};

export default DriveMode;
