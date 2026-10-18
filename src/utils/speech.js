// Best-effort spoken feedback via the browser's built-in speech synthesis.
// Silently does nothing where it's unsupported or blocked (iOS may refuse
// speech that isn't tied to a user gesture).
export const speakText = (text) => {
  try {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
    if (!synth || typeof window.SpeechSynthesisUtterance !== 'function') return;
    synth.cancel();
    synth.speak(new window.SpeechSynthesisUtterance(text));
  } catch (err) {
    console.error('Speech failed:', err);
  }
};

// iOS caps how many AudioContexts a page may create, so reuse one.
let chimeContext = null;

// A short "listening" beep. Best-effort, like speakText — call it from
// a user gesture so iOS lets the AudioContext start.
export const playChime = () => {
  try {
    const Context = typeof window !== 'undefined' ? window.AudioContext || window.webkitAudioContext : undefined;
    if (!Context) return;
    chimeContext = chimeContext || new Context();
    if (chimeContext.state === 'suspended') chimeContext.resume();
    const now = chimeContext.currentTime;
    const osc = chimeContext.createOscillator();
    const gain = chimeContext.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(chimeContext.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  } catch (err) {
    console.error('Chime failed:', err);
  }
};
