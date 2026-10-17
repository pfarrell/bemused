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
