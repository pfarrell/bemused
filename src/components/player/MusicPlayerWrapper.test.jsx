import { render, screen, fireEvent } from '@testing-library/react';
import MusicPlayerWrapper from './MusicPlayerWrapper';
import { usePlayerStore } from '../../stores/playerStore';

vi.mock('./PlaylistDrawer', () => ({ default: () => null }));

beforeEach(() => {
  usePlayerStore.setState({
    audioElementA: null, audioElementB: null, activeSlot: 'a', isPlaying: false, isBuffering: false, currentTime: 0, duration: 0,
    shuffle: false, drawerOpen: false, activityPulseToken: 0, playlist: [], currentTrackIndex: -1,
  });
});

test('renders two hidden audio elements and binds both into the store', () => {
  render(<MusicPlayerWrapper />);
  expect(usePlayerStore.getState().audioElementA).not.toBeNull();
  expect(usePlayerStore.getState().audioElementB).not.toBeNull();
});

test('play button calls togglePlayPause', () => {
  const togglePlayPause = vi.fn();
  usePlayerStore.setState({ togglePlayPause });
  render(<MusicPlayerWrapper />);
  fireEvent.click(screen.getByTitle('Play/Pause'));
  expect(togglePlayPause).toHaveBeenCalled();
});

test('next/prev buttons call playNext/playPrev', () => {
  const playNext = vi.fn();
  const playPrev = vi.fn();
  usePlayerStore.setState({ playNext, playPrev });
  render(<MusicPlayerWrapper />);
  fireEvent.click(screen.getByTitle('Next'));
  fireEvent.click(screen.getByTitle('Previous'));
  expect(playNext).toHaveBeenCalled();
  expect(playPrev).toHaveBeenCalled();
});

test('hamburger button toggles the drawer', () => {
  const toggleDrawer = vi.fn();
  usePlayerStore.setState({ toggleDrawer });
  render(<MusicPlayerWrapper />);
  fireEvent.click(screen.getByTitle('Toggle Playlist'));
  expect(toggleDrawer).toHaveBeenCalled();
});

test('progress bar shows the loading class while buffering', () => {
  usePlayerStore.setState({ isBuffering: true });
  render(<MusicPlayerWrapper />);
  expect(document.querySelector('.progress-bar-wrapper')).toHaveClass('loading');
});

test('seeking the range input calls seek with the corresponding time', () => {
  const seek = vi.fn();
  usePlayerStore.setState({ duration: 200, seek });
  render(<MusicPlayerWrapper />);
  fireEvent.change(screen.getByRole('slider'), { target: { value: '50' } });
  expect(seek).toHaveBeenCalledWith(100); // 50% of 200s
});
