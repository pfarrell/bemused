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

test('drag-forward reorder: dragging track at index 0 to drop target index 3 calls reorderPlaylist with correct pre-removal index', () => {
  const mockReorderPlaylist = vi.fn();
  usePlayerStore.setState({
    playlist: [track(1), track(2), track(3), track(4)],
    currentTrackIndex: 0,
    drawerOpen: true,
    playTrackAtIndex: vi.fn(),
    removeTrackFromPlaylist: vi.fn(),
    reorderPlaylist: mockReorderPlaylist,
    togglePlayPause: vi.fn(),
    toggleDrawer: vi.fn(),
  });

  const getBoundingClientRectSpy = vi.spyOn(Element.prototype, 'getBoundingClientRect');
  getBoundingClientRectSpy.mockReturnValue({
    top: 100,
    height: 50,
    bottom: 150,
    left: 0,
    right: 300,
    width: 300,
    x: 0,
    y: 100,
    toJSON: () => ({}),
  });

  render(<PlaylistDrawer />);

  const rows = screen.getAllByText(/Track [1-4]/);
  const row0 = rows[0].closest('.track-item');
  const row3 = rows[3].closest('.track-item');

  // Drag from row 0 (Track 1)
  fireEvent.dragStart(row0);

  // Drag over row 3 (must call dragOver to allow drop)
  fireEvent.dragOver(row3);

  // Drop on row 3 (Track 4) at a position below its midpoint
  // midpoint = 100 + 50/2 = 125, so clientY = 140 is below midpoint -> insert after (index + 1 = 4)
  // Create a synthetic event and manually set clientY
  const dropEvent = new Event('drop', { bubbles: true });
  Object.defineProperty(dropEvent, 'clientY', { value: 140, enumerable: true });
  Object.defineProperty(dropEvent, 'currentTarget', { value: row3, enumerable: true });
  Object.defineProperty(dropEvent, 'preventDefault', { value: vi.fn(), enumerable: true });
  row3.dispatchEvent(dropEvent);

  // Verify reorderPlaylist was called with (0, 4), not (0, 3)
  expect(mockReorderPlaylist).toHaveBeenCalledWith(0, 4);

  getBoundingClientRectSpy.mockRestore();
});
