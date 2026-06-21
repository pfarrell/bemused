import { render, screen, fireEvent } from '@testing-library/react';
import PlaylistDrawer from './PlaylistDrawer';
import { usePlayerStore } from '../../stores/playerStore';

vi.mock('../../services/api', () => ({ apiService: { getImageUrl: () => 'http://example.com/art.jpg' } }));

const track = (id, overrides = {}) => ({ id, title: `Track ${id}`, duration: 125, artist: { name: 'Artist' }, ...overrides });

beforeEach(() => {
  usePlayerStore.setState({
    playlist: [track(1), track(2), track(3)],
    currentTrackIndex: 1,
    drawerOpen: true,
    playTrackAtIndex: vi.fn(),
    removeTrackFromPlaylist: vi.fn(),
    reorderPlaylist: vi.fn(),
    togglePlayPause: vi.fn(),
    toggleDrawer: vi.fn(),
  });
});

test('renders nothing when the drawer is closed', () => {
  usePlayerStore.setState({ drawerOpen: false });
  render(<PlaylistDrawer />);
  expect(document.querySelector('.music-player-playlist-container')).toBeNull();
});

test('renders every track in the playlist', () => {
  render(<PlaylistDrawer />);
  expect(screen.getByText(/Track 1/)).toBeInTheDocument();
  expect(screen.getByText(/Track 2/)).toBeInTheDocument();
  expect(screen.getByText(/Track 3/)).toBeInTheDocument();
});

test('clicking a non-current row plays that track', () => {
  render(<PlaylistDrawer />);
  fireEvent.click(screen.getByText(/Track 3/));
  expect(usePlayerStore.getState().playTrackAtIndex).toHaveBeenCalledWith(2);
});

test('clicking the current row toggles play/pause instead of replaying', () => {
  render(<PlaylistDrawer />);
  fireEvent.click(screen.getByText(/Track 2/));
  expect(usePlayerStore.getState().togglePlayPause).toHaveBeenCalled();
  expect(usePlayerStore.getState().playTrackAtIndex).not.toHaveBeenCalled();
});

test('the delete button removes that track and does not also trigger a row click', () => {
  render(<PlaylistDrawer />);
  const row = screen.getByText(/Track 3/).closest('.track-item');
  fireEvent.click(row.querySelector('.track-delete-button'));
  expect(usePlayerStore.getState().removeTrackFromPlaylist).toHaveBeenCalledWith(2);
  expect(usePlayerStore.getState().playTrackAtIndex).not.toHaveBeenCalled();
});

test('clicking the backdrop closes the drawer', () => {
  render(<PlaylistDrawer />);
  fireEvent.click(document.querySelector('.playlist-backdrop'));
  expect(usePlayerStore.getState().toggleDrawer).toHaveBeenCalled();
});

test('the currently playing row has the active class', () => {
  render(<PlaylistDrawer />);
  expect(screen.getByText(/Track 2/).closest('.track-item')).toHaveClass('active');
});
