import { describe, test, expect, afterEach, vi } from 'vitest';
import { speakText, playChime } from './speech';

describe('speakText', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('cancels anything already speaking, then speaks the text', () => {
    const speak = vi.fn();
    const cancel = vi.fn();
    vi.stubGlobal('speechSynthesis', { speak, cancel });
    vi.stubGlobal('SpeechSynthesisUtterance', function Utterance(text) { this.text = text; });

    speakText('Playing Radiohead');

    expect(cancel).toHaveBeenCalled();
    expect(speak).toHaveBeenCalledWith(expect.objectContaining({ text: 'Playing Radiohead' }));
  });

  test('does nothing when speech synthesis is unsupported', () => {
    vi.stubGlobal('speechSynthesis', undefined);
    expect(() => speakText('hello')).not.toThrow();
  });

  test('swallows errors from a browser that blocks speech', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('speechSynthesis', { cancel: vi.fn(), speak: () => { throw new Error('not allowed'); } });
    vi.stubGlobal('SpeechSynthesisUtterance', function Utterance() {});
    expect(() => speakText('hello')).not.toThrow();
  });
});

describe('playChime', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('plays a short tone through Web Audio', () => {
    const osc = { connect: vi.fn(), start: vi.fn(), stop: vi.fn(), frequency: { value: 0 } };
    const gain = { connect: vi.fn(), gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() } };
    vi.stubGlobal('AudioContext', function FakeContext() {
      this.currentTime = 0;
      this.state = 'running';
      this.destination = {};
      this.createOscillator = () => osc;
      this.createGain = () => gain;
    });

    playChime();

    expect(osc.connect).toHaveBeenCalledWith(gain);
    expect(osc.start).toHaveBeenCalled();
    expect(osc.stop).toHaveBeenCalled();
  });

  test('does nothing when Web Audio is unsupported', () => {
    vi.stubGlobal('AudioContext', undefined);
    vi.stubGlobal('webkitAudioContext', undefined);
    expect(() => playChime()).not.toThrow();
  });
});
