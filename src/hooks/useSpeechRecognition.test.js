import { describe, test, expect, afterEach, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpeechRecognition } from './useSpeechRecognition';

// Minimal stand-in for webkitSpeechRecognition: records instances and lets
// tests fire the events a real recognizer would.
let instances;
class FakeRecognition {
  constructor() {
    this.start = vi.fn();
    this.stop = vi.fn();
    this.abort = vi.fn();
    instances.push(this);
  }

  emitResult(parts) {
    const results = parts.map(({ text, isFinal }) => Object.assign([{ transcript: text }], { isFinal }));
    this.onresult({ results });
  }

  emitEnd() {
    this.onend();
  }
}

describe('useSpeechRecognition', () => {
  beforeEach(() => {
    instances = [];
    vi.stubGlobal('webkitSpeechRecognition', FakeRecognition);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  test('reports unsupported when the browser has no recognizer', () => {
    vi.stubGlobal('webkitSpeechRecognition', undefined);
    const { result } = renderHook(() => useSpeechRecognition({ onEnd: vi.fn() }));

    expect(result.current.supported).toBe(false);
    let started;
    act(() => { started = result.current.start(); });
    expect(started).toBe(false);
  });

  test('start begins a single-utterance English session', () => {
    const { result } = renderHook(() => useSpeechRecognition({ onEnd: vi.fn() }));

    act(() => { result.current.start(); });

    expect(instances).toHaveLength(1);
    expect(instances[0].start).toHaveBeenCalled();
    expect(instances[0].continuous).toBe(false);
    expect(instances[0].lang).toBe('en-US');
    expect(result.current.listening).toBe(true);
  });

  test('passes the final transcript to onEnd when the session ends', () => {
    const onEnd = vi.fn();
    const { result } = renderHook(() => useSpeechRecognition({ onEnd }));

    act(() => { result.current.start(); });
    act(() => { instances[0].emitResult([{ text: 'play album kind of blue', isFinal: true }]); });
    act(() => { instances[0].emitEnd(); });

    expect(onEnd).toHaveBeenCalledWith('play album kind of blue');
    expect(result.current.listening).toBe(false);
  });

  test('falls back to the last interim transcript when nothing was marked final', () => {
    const onEnd = vi.fn();
    const { result } = renderHook(() => useSpeechRecognition({ onEnd }));

    act(() => { result.current.start(); });
    act(() => { instances[0].emitResult([{ text: 'play artist', isFinal: false }]); });
    act(() => { instances[0].emitResult([{ text: 'play artist radiohead', isFinal: false }]); });
    expect(result.current.transcript).toBe('play artist radiohead');
    act(() => { instances[0].emitEnd(); });

    expect(onEnd).toHaveBeenCalledWith('play artist radiohead');
  });

  test('passes an empty string when nothing was heard', () => {
    const onEnd = vi.fn();
    const { result } = renderHook(() => useSpeechRecognition({ onEnd }));

    act(() => { result.current.start(); });
    act(() => { instances[0].emitEnd(); });

    expect(onEnd).toHaveBeenCalledWith('');
  });

  test('ends the session cleanly when start() throws', () => {
    instances = [];
    vi.stubGlobal('webkitSpeechRecognition', class extends FakeRecognition {
      constructor() {
        super();
        this.start = () => { throw new Error('already started'); };
      }
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const onEnd = vi.fn();
    const { result } = renderHook(() => useSpeechRecognition({ onEnd }));

    let started;
    act(() => { started = result.current.start(); });

    expect(started).toBe(false);
    expect(result.current.listening).toBe(false);
    expect(onEnd).not.toHaveBeenCalled();
  });

  test('stop escalates to abort, then a forced end, when iOS never fires end', () => {
    vi.useFakeTimers();
    const onEnd = vi.fn();
    const { result } = renderHook(() => useSpeechRecognition({ onEnd }));

    act(() => { result.current.start(); });
    act(() => { instances[0].emitResult([{ text: 'play album abbey road', isFinal: false }]); });
    act(() => { result.current.stop(); });
    expect(instances[0].stop).toHaveBeenCalled();
    expect(instances[0].abort).not.toHaveBeenCalled();

    act(() => { vi.advanceTimersByTime(1500); });
    expect(instances[0].abort).toHaveBeenCalled();
    expect(onEnd).not.toHaveBeenCalled();

    act(() => { vi.advanceTimersByTime(1500); });
    expect(onEnd).toHaveBeenCalledWith('play album abbey road');
    expect(result.current.listening).toBe(false);
  });

  test('a late end event after a forced end does not call onEnd twice', () => {
    vi.useFakeTimers();
    const onEnd = vi.fn();
    const { result } = renderHook(() => useSpeechRecognition({ onEnd }));

    act(() => { result.current.start(); });
    act(() => { result.current.stop(); });
    act(() => { vi.advanceTimersByTime(3000); });
    act(() => { instances[0].emitEnd(); });

    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  test('stop does not escalate once the session has ended normally', () => {
    vi.useFakeTimers();
    const onEnd = vi.fn();
    const { result } = renderHook(() => useSpeechRecognition({ onEnd }));

    act(() => { result.current.start(); });
    act(() => { result.current.stop(); });
    act(() => { instances[0].emitEnd(); });
    act(() => { vi.advanceTimersByTime(3000); });

    expect(instances[0].abort).not.toHaveBeenCalled();
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  test('aborts an in-progress session on unmount without calling onEnd', () => {
    const onEnd = vi.fn();
    const { result, unmount } = renderHook(() => useSpeechRecognition({ onEnd }));

    act(() => { result.current.start(); });
    unmount();

    expect(instances[0].abort).toHaveBeenCalled();
    act(() => { instances[0].emitEnd(); });
    expect(onEnd).not.toHaveBeenCalled();
  });
});
