import { describe, test, expect, afterEach, vi } from 'vitest';
import { speakText } from './speech';

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
