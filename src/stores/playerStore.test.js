import { usePlayerStore } from './playerStore';
import { describe, test, expect, beforeEach, vi } from 'vitest';

const track = (id, overrides = {}) => ({ id, title: `Track ${id}`, url: `/stream/${id}`, duration: 180, artist: { name: 'A' }, ...overrides });

const mockAudioElement = () => ({
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
  load: vi.fn(),
  paused: true,
  src: '',
  currentTime: 0,
});

beforeEach(() => {
  usePlayerStore.setState({
    audioElement: null,
    playlist: [],
    currentTrackIndex: -1,
    currentTrack: null,
    isPlaying: false,
    isBuffering: false,
    currentTime: 0,
    duration: 0,
    playlistFinished: false,
    shuffle: false,
    shuffleHistory: [],
    drawerOpen: false,
    activityPulseToken: 0,
    recentlyAddedIndices: [],
  });
});

describe('playTrackAtIndex', () => {
  test('sets currentTrack/currentTrackIndex and loads the audio element', () => {
    const audioElement = mockAudioElement();
    usePlayerStore.setState({ audioElement, playlist: [track(1), track(2)] });
    usePlayerStore.getState().playTrackAtIndex(1);
    const state = usePlayerStore.getState();
    expect(state.currentTrackIndex).toBe(1);
    expect(state.currentTrack.id).toBe(2);
    expect(audioElement.src).toBe('/stream/2');
    expect(audioElement.load).toHaveBeenCalled();
    expect(audioElement.play).toHaveBeenCalled();
  });

  test('does nothing for an out-of-range index', () => {
    const audioElement = mockAudioElement();
    usePlayerStore.setState({ audioElement, playlist: [track(1)] });
    usePlayerStore.getState().playTrackAtIndex(5);
    expect(usePlayerStore.getState().currentTrackIndex).toBe(-1);
    expect(audioElement.load).not.toHaveBeenCalled();
  });
});

describe('addTrack', () => {
  test('appends the track and starts playback when nothing is playing', () => {
    const audioElement = mockAudioElement();
    usePlayerStore.setState({ audioElement, playlist: [], isPlaying: false });
    usePlayerStore.getState().addTrack(track(1));
    const state = usePlayerStore.getState();
    expect(state.playlist).toHaveLength(1);
    expect(state.currentTrackIndex).toBe(0);
    expect(audioElement.play).toHaveBeenCalled();
  });

  test('appends without starting playback when something is already playing', () => {
    const audioElement = mockAudioElement();
    usePlayerStore.setState({ audioElement, playlist: [track(1)], currentTrackIndex: 0, isPlaying: true });
    usePlayerStore.getState().addTrack(track(2));
    const state = usePlayerStore.getState();
    expect(state.playlist).toHaveLength(2);
    expect(state.currentTrackIndex).toBe(0); // unchanged
    expect(audioElement.play).not.toHaveBeenCalled();
  });

  test('throws on a track missing title or url', () => {
    expect(() => usePlayerStore.getState().addTrack({ id: 1 })).toThrow(/Invalid track/);
  });

  test('flashActivity bumps activityPulseToken', () => {
    usePlayerStore.setState({ audioElement: mockAudioElement() });
    usePlayerStore.getState().addTrack(track(1), { flashActivity: true });
    expect(usePlayerStore.getState().activityPulseToken).toBe(1);
  });
});

describe('addTracks', () => {
  test('regression (fa854a2/fe75093): auto-plays the first track of a multi-track add at its real index when paused, even with an existing playlist', () => {
    const audioElement = mockAudioElement();
    usePlayerStore.setState({
      audioElement,
      playlist: [track(101), track(102)],
      currentTrackIndex: 0,
      isPlaying: false,
    });
    usePlayerStore.getState().addTracks([track(201), track(202)], false, { flashActivity: true });
    const state = usePlayerStore.getState();
    expect(state.playlist).toHaveLength(4);
    // First newly-added track is at index 2 (the real index), not 0 or -1.
    expect(state.currentTrackIndex).toBe(2);
    expect(audioElement.src).toBe('/stream/201');
  });

  test('playNext=true inserts immediately after the current track', () => {
    usePlayerStore.setState({
      audioElement: mockAudioElement(),
      playlist: [track(1), track(2), track(3)],
      currentTrackIndex: 0,
      isPlaying: true,
    });
    usePlayerStore.getState().addTracks([track(99)], true);
    const ids = usePlayerStore.getState().playlist.map((t) => t.id);
    expect(ids).toEqual([1, 99, 2, 3]);
  });

  test('throws if tracks is not an array', () => {
    expect(() => usePlayerStore.getState().addTracks('nope')).toThrow(/must be provided as an array/);
  });
});

describe('recentlyAddedIndices', () => {
  test('addTrack with flashActivity records the new entry\'s playlist position, not its id', () => {
    usePlayerStore.setState({ audioElement: mockAudioElement(), playlist: [track(99), track(98)] });
    usePlayerStore.getState().addTrack(track(5), { flashActivity: true });
    expect(usePlayerStore.getState().recentlyAddedIndices).toEqual([2]);
  });

  test('addTrack without flashActivity does not touch recentlyAddedIndices', () => {
    usePlayerStore.setState({ audioElement: mockAudioElement(), recentlyAddedIndices: [99] });
    usePlayerStore.getState().addTrack(track(1));
    expect(usePlayerStore.getState().recentlyAddedIndices).toEqual([99]);
  });

  test('a second flashActivity add replaces the previous batch instead of accumulating', () => {
    // Regression: queue track 2 (flash), then queue tracks 7/8 (flash) before
    // ever opening the drawer — only 7/8 (the latest batch) should remain
    // marked; track 2's earlier position should no longer be flagged even
    // though it was never seen.
    usePlayerStore.setState({
      audioElement: mockAudioElement(),
      playlist: [track(1), track(2)],
      currentTrackIndex: 0,
      isPlaying: true,
      recentlyAddedIndices: [1],
    });
    usePlayerStore.getState().addTracks([track(7), track(8)], false, { flashActivity: true });
    expect(usePlayerStore.getState().recentlyAddedIndices).toEqual([2, 3]);
  });

  test('regression: queueing a track whose id already exists elsewhere in the playlist only marks the new occurrence', () => {
    usePlayerStore.setState({ audioElement: mockAudioElement(), playlist: [track(5)], isPlaying: true });
    usePlayerStore.getState().addTrack(track(5), { flashActivity: true });
    expect(usePlayerStore.getState().playlist).toHaveLength(2);
    expect(usePlayerStore.getState().recentlyAddedIndices).toEqual([1]);
  });

  test('clearRecentlyAdded resets the list to empty', () => {
    usePlayerStore.setState({ recentlyAddedIndices: [1, 2] });
    usePlayerStore.getState().clearRecentlyAdded();
    expect(usePlayerStore.getState().recentlyAddedIndices).toEqual([]);
  });
});

describe('removeTrackFromPlaylist', () => {
  test('refuses to remove the currently playing track', () => {
    usePlayerStore.setState({ playlist: [track(1), track(2)], currentTrackIndex: 0 });
    usePlayerStore.getState().removeTrackFromPlaylist(0);
    expect(usePlayerStore.getState().playlist).toHaveLength(2);
  });

  test('removing a track before the current one decrements currentTrackIndex', () => {
    usePlayerStore.setState({ playlist: [track(1), track(2), track(3)], currentTrackIndex: 2 });
    usePlayerStore.getState().removeTrackFromPlaylist(0);
    const state = usePlayerStore.getState();
    expect(state.playlist.map((t) => t.id)).toEqual([2, 3]);
    expect(state.currentTrackIndex).toBe(1);
  });

  test('removing the last track resets playback state', () => {
    const audioElement = mockAudioElement();
    usePlayerStore.setState({ audioElement, playlist: [track(1)], currentTrackIndex: -1 });
    usePlayerStore.getState().removeTrackFromPlaylist(0);
    const state = usePlayerStore.getState();
    expect(state.playlist).toHaveLength(0);
    expect(state.currentTrackIndex).toBe(-1);
    expect(audioElement.pause).toHaveBeenCalled();
  });
});

describe('reorderPlaylist', () => {
  test('moves a track and keeps currentTrackIndex pointing at the same track', () => {
    usePlayerStore.setState({ playlist: [track(1), track(2), track(3)], currentTrackIndex: 2 });
    usePlayerStore.getState().reorderPlaylist(0, 2); // move track 1 to index 2
    const state = usePlayerStore.getState();
    expect(state.playlist.map((t) => t.id)).toEqual([2, 1, 3]);
    expect(state.currentTrackIndex).toBe(2); // track 3 is at index 2 in [2,1,3]
  });
});

describe('playNext / shuffle', () => {
  test('non-shuffle: advances to the next index', () => {
    usePlayerStore.setState({ audioElement: mockAudioElement(), playlist: [track(1), track(2)], currentTrackIndex: 0 });
    usePlayerStore.getState().playNext();
    expect(usePlayerStore.getState().currentTrackIndex).toBe(1);
  });

  test('non-shuffle: marks playlistFinished and pauses on the last track', () => {
    const audioElement = mockAudioElement();
    usePlayerStore.setState({ audioElement, playlist: [track(1), track(2)], currentTrackIndex: 1 });
    usePlayerStore.getState().playNext();
    const state = usePlayerStore.getState();
    expect(state.playlistFinished).toBe(true);
    expect(audioElement.pause).toHaveBeenCalled();
  });

  test('toggleShuffle(on) jumps to a random track and seeds shuffleHistory', () => {
    usePlayerStore.setState({ audioElement: mockAudioElement(), playlist: [track(1), track(2), track(3)], currentTrackIndex: 0 });
    usePlayerStore.getState().toggleShuffle();
    const state = usePlayerStore.getState();
    expect(state.shuffle).toBe(true);
    expect(state.shuffleHistory).toEqual([state.currentTrackIndex]);
  });

  test('playPrev() on an empty playlist does not throw and leaves state sane', () => {
    usePlayerStore.setState({ audioElement: mockAudioElement(), playlist: [], currentTrackIndex: -1 });
    expect(() => usePlayerStore.getState().playPrev()).not.toThrow();
    const state = usePlayerStore.getState();
    expect(state.currentTrackIndex).toBe(-1);
    expect(state.playlist).toHaveLength(0);
  });
});

describe('clearPlaylist', () => {
  test('resets all playback state and stops the audio element', () => {
    const audioElement = mockAudioElement();
    usePlayerStore.setState({ audioElement, playlist: [track(1)], currentTrackIndex: 0, currentTrack: track(1), isPlaying: true });
    usePlayerStore.getState().clearPlaylist();
    const state = usePlayerStore.getState();
    expect(state.playlist).toEqual([]);
    expect(state.currentTrackIndex).toBe(-1);
    expect(state.currentTrack).toBeNull();
    expect(audioElement.pause).toHaveBeenCalled();
  });
});

describe('setPlaylist', () => {
  test('replaces the queue and starts playing the first track', () => {
    const audioElement = mockAudioElement();
    usePlayerStore.setState({ audioElement, playlist: [track(1)], currentTrackIndex: 0, isPlaying: true });
    usePlayerStore.getState().setPlaylist([track(9), track(10)]);
    const state = usePlayerStore.getState();
    expect(state.playlist.map((t) => t.id)).toEqual([9, 10]);
    expect(state.currentTrackIndex).toBe(0);
  });
});
