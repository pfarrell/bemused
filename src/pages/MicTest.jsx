// Throwaway diagnostic page for the "drive mode" spike: checks whether the Web
// Speech API's recognizer works in the installed iOS PWA, how it interacts with
// playback, and whether wake lock / speech synthesis survive a mic session.
// Not linked from anywhere — open /mic-test directly.

import { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '../stores/playerStore';
import { useProfileFilterStore } from '../stores/profileFilterStore';
import { parseSearchCommand, runSearchCommand } from '../utils/searchCommands';
import { speakText } from '../utils/speech';

const Recognition = typeof window !== 'undefined'
  ? window.SpeechRecognition || window.webkitSpeechRecognition
  : undefined;

const envInfo = () => ({
  standalone: window.navigator.standalone === true || window.matchMedia?.('(display-mode: standalone)').matches,
  speechRecognition: window.SpeechRecognition ? 'SpeechRecognition' : window.webkitSpeechRecognition ? 'webkitSpeechRecognition' : 'missing',
  speechSynthesis: 'speechSynthesis' in window,
  wakeLock: 'wakeLock' in navigator,
  mediaSession: 'mediaSession' in navigator,
  userAgent: navigator.userAgent,
});

const MicTest = () => {
  const [log, setLog] = useState([]);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [pauseMusic, setPauseMusic] = useState(true);
  const [speakBack, setSpeakBack] = useState(true);
  const [runCommand, setRunCommand] = useState(false);
  const [wakeLock, setWakeLock] = useState(null);
  const recognitionRef = useRef(null);
  const endSessionRef = useRef(null);
  const tapTimeRef = useRef(0);
  const activeProfileId = useProfileFilterStore((s) => s.activeProfileId);

  const addLog = (msg) => {
    const t = tapTimeRef.current ? `+${Math.round(performance.now() - tapTimeRef.current)}ms` : '';
    setLog((prev) => [...prev, `${new Date().toLocaleTimeString()} ${t} ${msg}`]);
  };

  useEffect(() => {
    addLog(`env ${JSON.stringify(envInfo())}`);
    navigator.permissions?.query({ name: 'microphone' })
      .then((p) => addLog(`mic permission: ${p.state}`))
      .catch((err) => addLog(`mic permission query failed: ${err.message}`));
    return () => recognitionRef.current?.abort();
  }, []);

  const audioState = () => {
    const audio = usePlayerStore.getState().getActiveAudio();
    return audio ? `paused=${audio.paused} t=${audio.currentTime.toFixed(1)}` : 'no audio element';
  };

  const finish = async (finalText, pausedByUs) => {
    addLog(`audio after end: ${audioState()}`);
    // Give iOS a moment to restore the audio session before judging playback.
    setTimeout(() => addLog(`audio 1s after end: ${audioState()}`), 1000);

    const command = finalText ? parseSearchCommand(finalText) : null;
    addLog(`parsed: ${command ? JSON.stringify(command) : 'not a command'}`);

    if (command && runCommand) {
      const result = await runSearchCommand(command, {
        profileId: activeProfileId,
        navigate: (path) => addLog(`(would navigate to ${path})`),
        speak: speakBack ? speakText : () => {},
      });
      addLog(`command result: ${JSON.stringify(result)}`);
      return;
    }

    if (speakBack) speakText(finalText ? `I heard: ${finalText}` : 'I did not catch that');
    if (pausedByUs) {
      usePlayerStore.getState().togglePlayPause();
      addLog('resumed playback');
    }
  };

  // iOS's recognizer doesn't always fire 'end' after stop(), so escalate:
  // stop() → abort() after 1.5s → give up and reset the UI after another 1.5s.
  const stopListening = () => {
    const recognition = recognitionRef.current;
    addLog(`stop tapped (recognizer ${recognition ? 'present' : 'missing'})`);
    if (!recognition) {
      setListening(false);
      return;
    }
    try {
      recognition.stop();
      addLog('stop() called');
    } catch (err) {
      addLog(`stop() threw: ${err.name} ${err.message}`);
    }
    setTimeout(() => {
      if (recognitionRef.current !== recognition) return;
      addLog('no end event 1.5s after stop() — calling abort()');
      try {
        recognition.abort();
      } catch (err) {
        addLog(`abort() threw: ${err.name} ${err.message}`);
      }
      setTimeout(() => {
        if (recognitionRef.current !== recognition) return;
        addLog('no end event 1.5s after abort() — forcing reset');
        endSessionRef.current?.();
      }, 1500);
    }, 1500);
  };

  const startListening = () => {
    if (listening) {
      stopListening();
      return;
    }
    tapTimeRef.current = performance.now();
    setTranscript('');
    if (!Recognition) {
      addLog('no SpeechRecognition constructor available');
      return;
    }

    let pausedByUs = false;
    addLog(`audio before: ${audioState()}`);
    if (pauseMusic && usePlayerStore.getState().isPlaying) {
      usePlayerStore.getState().togglePlayPause();
      pausedByUs = true;
      addLog('paused playback');
    }

    const recognition = new Recognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 3;
    recognitionRef.current = recognition;

    let finalText = '';
    let latestText = '';
    for (const evt of ['start', 'audiostart', 'soundstart', 'speechstart', 'speechend', 'soundend', 'audioend', 'nomatch']) {
      recognition.addEventListener(evt, () => addLog(`event: ${evt}`));
    }
    recognition.onresult = (e) => {
      const text = Array.from(e.results).map((r) => r[0].transcript).join('');
      latestText = text;
      setTranscript(text);
      const last = e.results[e.results.length - 1];
      if (last.isFinal) {
        finalText = text;
        const alts = Array.from(last).map((a) => `"${a.transcript}" (${a.confidence?.toFixed?.(2)})`).join(', ');
        addLog(`final: ${alts}`);
      }
    };
    recognition.onerror = (e) => addLog(`error: ${e.error} ${e.message || ''}`);
    let ended = false;
    const endSession = () => {
      if (ended) return;
      ended = true;
      setListening(false);
      recognitionRef.current = null;
      endSessionRef.current = null;
      // iOS sometimes ends without marking a result final — fall back to the
      // last interim transcript.
      finish(finalText || latestText, pausedByUs);
    };
    endSessionRef.current = endSession;
    recognition.onend = () => {
      addLog('event: end');
      endSession();
    };

    try {
      recognition.start();
      setListening(true);
      addLog('start() called');
    } catch (err) {
      addLog(`start() threw: ${err.name} ${err.message}`);
    }
  };

  const toggleWakeLock = async () => {
    if (wakeLock) {
      await wakeLock.release();
      setWakeLock(null);
      addLog('wake lock released');
      return;
    }
    try {
      const lock = await navigator.wakeLock.request('screen');
      lock.addEventListener('release', () => addLog('wake lock released (by system)'));
      setWakeLock(lock);
      addLog('wake lock acquired');
    } catch (err) {
      addLog(`wake lock failed: ${err.name} ${err.message}`);
    }
  };

  const copyLog = async () => {
    try {
      await navigator.clipboard.writeText(log.join('\n'));
      addLog('log copied');
    } catch (err) {
      addLog(`copy failed: ${err.message}`);
    }
  };

  const checkbox = (label, value, setter) => (
    <label style={{ display: 'block', margin: '0.4rem 0', fontSize: '1rem' }}>
      <input type="checkbox" checked={value} onChange={(e) => setter(e.target.checked)} /> {label}
    </label>
  );

  return (
    <div style={{ padding: '1rem', color: '#fff' }}>
      <h2 style={{ marginTop: 0 }}>Mic test</h2>
      <button
        type="button"
        onClick={startListening}
        style={{
          width: '100%',
          height: '40vh',
          fontSize: '2.5rem',
          fontWeight: 'bold',
          border: 'none',
          borderRadius: '1.5rem',
          color: '#fff',
          background: listening ? '#dc2626' : '#2563eb',
        }}
      >
        {listening ? 'Listening… (tap to stop)' : 'Tap to speak'}
      </button>
      <div style={{ minHeight: '2rem', fontSize: '1.4rem', margin: '1rem 0' }}>{transcript}</div>

      {checkbox('Pause music while listening', pauseMusic, setPauseMusic)}
      {checkbox('Speak back what was heard', speakBack, setSpeakBack)}
      {checkbox('Run "play …" commands for real (replaces queue)', runCommand, setRunCommand)}

      <div style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0' }}>
        <button type="button" onClick={toggleWakeLock}>{wakeLock ? 'Release wake lock' : 'Keep screen awake'}</button>
        <button type="button" onClick={copyLog}>Copy log</button>
        <button type="button" onClick={() => setLog([])}>Clear log</button>
      </div>

      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.75rem', background: '#111', padding: '0.5rem' }}>
        {log.join('\n')}
      </pre>
    </div>
  );
};

export default MicTest;
