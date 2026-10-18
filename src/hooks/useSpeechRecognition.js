import { useCallback, useEffect, useRef, useState } from 'react';

// iOS's recognizer doesn't always fire 'end' after stop() (seen on the
// installed PWA), so stop() escalates: stop() → abort() → give up and end the
// session ourselves, each step this long after the last.
const STOP_ESCALATION_MS = 1500;

const getRecognition = () =>
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : undefined;

// One-utterance speech recognition sessions. start() must be called from a
// user gesture (iOS refuses otherwise). onEnd(text) fires exactly once per
// session with the final transcript, the last interim one if the recognizer
// never marked a result final, or '' if nothing was heard.
export const useSpeechRecognition = ({ onEnd }) => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const sessionRef = useRef(null);
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  useEffect(() => () => {
    const session = sessionRef.current;
    if (!session) return;
    session.ended = true;
    session.timers.forEach(clearTimeout);
    session.recognition.abort();
  }, []);

  const start = useCallback(() => {
    const Recognition = getRecognition();
    if (!Recognition || sessionRef.current) return false;

    const recognition = new Recognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;

    const session = { recognition, text: '', ended: false, timers: [] };
    session.end = () => {
      if (session.ended) return;
      session.ended = true;
      session.timers.forEach(clearTimeout);
      sessionRef.current = null;
      setListening(false);
      onEndRef.current?.(session.text);
    };

    recognition.onresult = (e) => {
      session.text = Array.from(e.results).map((r) => r[0].transcript).join('');
      setTranscript(session.text);
    };
    recognition.onerror = (e) => console.error('Speech recognition error:', e.error);
    recognition.onend = session.end;

    try {
      recognition.start();
    } catch (err) {
      console.error('Speech recognition failed to start:', err);
      return false;
    }
    sessionRef.current = session;
    setTranscript('');
    setListening(true);
    return true;
  }, []);

  const stop = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    session.recognition.stop();
    session.timers.push(setTimeout(() => {
      session.recognition.abort();
      session.timers.push(setTimeout(session.end, STOP_ESCALATION_MS));
    }, STOP_ESCALATION_MS));
  }, []);

  return { supported: !!getRecognition(), listening, transcript, start, stop };
};
