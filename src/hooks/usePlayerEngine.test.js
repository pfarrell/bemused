import { renderHook } from '@testing-library/react';
import { usePlayerEngine } from './usePlayerEngine';
import { usePlayerStore } from '../stores/playerStore';
import { apiService } from '../services/api';

vi.mock('../services/api', () => ({
  apiService: {
    log: vi.fn(),
    getImageUrl: vi.fn(() => 'http://example.com/art.jpg'),
  },
}));

const makeAudioRef = () => {
  const audio = document.createElement('audio');
  Object.defineProperty(audio, 'currentTime', {
    writable: true,
    value: 0,
  });
  Object.defineProperty(audio, 'duration', {
    writable: true,
    value: 0,
  });
  return { current: audio };
};

beforeEach(() => {
  usePlayerStore.setState({
    audioElement: null, currentTrack: null, currentTime: 0, duration: 0, isPlaying: false, isBuffering: false,
  });
  vi.clearAllMocks();
});

test('binds the audio element into the store on mount', () => {
  const audioRef = makeAudioRef();
  renderHook(() => usePlayerEngine(audioRef));
  expect(usePlayerStore.getState().audioElement).toBe(audioRef.current);
});

test('unbinds the audio element on unmount', () => {
  const audioRef = makeAudioRef();
  const { unmount } = renderHook(() => usePlayerEngine(audioRef));
  unmount();
  expect(usePlayerStore.getState().audioElement).toBeNull();
});

test('play/pause DOM events update isPlaying', () => {
  const audioRef = makeAudioRef();
  renderHook(() => usePlayerEngine(audioRef));
  audioRef.current.dispatchEvent(new Event('play'));
  expect(usePlayerStore.getState().isPlaying).toBe(true);
  audioRef.current.dispatchEvent(new Event('pause'));
  expect(usePlayerStore.getState().isPlaying).toBe(false);
});

test('waiting/playing DOM events toggle isBuffering', () => {
  const audioRef = makeAudioRef();
  renderHook(() => usePlayerEngine(audioRef));
  audioRef.current.dispatchEvent(new Event('waiting'));
  expect(usePlayerStore.getState().isBuffering).toBe(true);
  audioRef.current.dispatchEvent(new Event('playing'));
  expect(usePlayerStore.getState().isBuffering).toBe(false);
});

test('ended DOM event calls playNext', () => {
  const audioRef = makeAudioRef();
  const playNext = vi.fn();
  usePlayerStore.setState({ playNext });
  renderHook(() => usePlayerEngine(audioRef));
  audioRef.current.dispatchEvent(new Event('ended'));
  expect(playNext).toHaveBeenCalled();
});

test('timeupdate fires apiService.log once the 5-second mark is crossed, and only once', () => {
  const audioRef = makeAudioRef();
  usePlayerStore.setState({ currentTrack: { id: 42 } });
  renderHook(() => usePlayerEngine(audioRef));

  audioRef.current.currentTime = 3;
  audioRef.current.dispatchEvent(new Event('timeupdate'));
  expect(apiService.log).not.toHaveBeenCalled();

  audioRef.current.currentTime = 6;
  audioRef.current.dispatchEvent(new Event('timeupdate'));
  expect(apiService.log).toHaveBeenCalledWith(42);

  audioRef.current.currentTime = 7;
  audioRef.current.dispatchEvent(new Event('timeupdate'));
  expect(apiService.log).toHaveBeenCalledTimes(1);
});

test('a fresh play resets the 5-second mark so it fires again on the next track', () => {
  const audioRef = makeAudioRef();
  usePlayerStore.setState({ currentTrack: { id: 1 } });
  renderHook(() => usePlayerEngine(audioRef));

  audioRef.current.currentTime = 6;
  audioRef.current.dispatchEvent(new Event('timeupdate'));
  expect(apiService.log).toHaveBeenCalledTimes(1);

  usePlayerStore.setState({ currentTrack: { id: 2 } });
  audioRef.current.dispatchEvent(new Event('play'));
  audioRef.current.currentTime = 6;
  audioRef.current.dispatchEvent(new Event('timeupdate'));
  expect(apiService.log).toHaveBeenCalledWith(2);
  expect(apiService.log).toHaveBeenCalledTimes(2);
});
