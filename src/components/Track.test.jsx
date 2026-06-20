import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Track from './Track';
import { usePlayerStore } from '../stores/playerStore';

vi.mock('./AddToPlaylistModal', () => ({ default: () => null }));

const mockTrack = {
  id: 1,
  title: 'Test Track',
  duration: 180,
  artist: { name: 'Test Artist' },
  album: {
    id: 10,
    title: 'Test Album',
    artist: { id: 5, name: 'Album Artist' },
  },
};

const renderTrack = (props = {}) =>
  render(
    <MemoryRouter>
      <Track track={mockTrack} index={0} trackCount={1} {...props} />
    </MemoryRouter>
  );

beforeEach(() => {
  usePlayerStore.setState({
    playerInstance: null,
    currentTrack: null,
    playlist: [],
    isPlaying: false,
    currentTrackIndex: -1,
  });
});

describe('Track component', () => {
  test('renders the track title', () => {
    renderTrack();
    expect(screen.getByText(/Test Track/)).toBeInTheDocument();
  });

  test('renders track number', () => {
    renderTrack();
    expect(screen.getByText(/01\./)).toBeInTheDocument();
  });

  test('renders play button when not playing', () => {
    renderTrack({ isPlaying: false });
    // The ▶ symbol appears in the play button span; use getAllByText since it also
    // appears in the "▶ Play Now" dropdown button (hidden until right-click)
    const playButtons = screen.getAllByText('▶');
    expect(playButtons.length).toBeGreaterThan(0);
  });

  test('renders now-playing indicator when isPlaying is true', () => {
    renderTrack({ isPlaying: true });
    expect(screen.getByText('♪')).toBeInTheDocument();
  });

  test('does not render album link when includeMeta is false', () => {
    renderTrack({ includeMeta: false });
    expect(screen.queryByText('Test Album')).not.toBeInTheDocument();
  });

  test('renders album link when includeMeta is true', () => {
    renderTrack({ includeMeta: true });
    expect(screen.getByText('Test Album')).toBeInTheDocument();
  });

  test('renders artist link when includeMeta is true', () => {
    renderTrack({ includeMeta: true });
    expect(screen.getByText('Album Artist')).toBeInTheDocument();
  });

  test('renders formatted duration', () => {
    renderTrack();
    expect(screen.getByText('(3:00)')).toBeInTheDocument();
  });

  test('long-press menu stays open after finger release, closes on a later tap-away', () => {
    vi.useFakeTimers();
    usePlayerStore.setState({ playerInstance: { playlist: [], audioPlayer: { paused: true } } });
    renderTrack();
    const row = screen.getByText(/Test Track/).closest('.track-item');

    // Long-press opens the menu (finger still down)
    fireEvent.touchStart(row, { touches: [{ clientX: 50, clientY: 50 }] });
    act(() => { vi.advanceTimersByTime(500); });
    expect(screen.getByText('▶ Play Now')).toBeInTheDocument();

    // Finger lifts, then the synthesized click lands on the backdrop — menu must persist
    fireEvent.touchEnd(row);
    fireEvent.click(screen.getByTestId('track-menu-backdrop'));
    expect(screen.getByText('▶ Play Now')).toBeInTheDocument();

    // After the release window, a deliberate tap on the backdrop closes it
    act(() => { vi.advanceTimersByTime(350); });
    fireEvent.click(screen.getByTestId('track-menu-backdrop'));
    expect(screen.queryByText('▶ Play Now')).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  const renderWithPlayer = () => {
    usePlayerStore.setState({
      playerInstance: {
        playlist: [],
        audioPlayer: { paused: true },
        currentTrackIndex: 0,
        addTrack: vi.fn(),
        addTracks: vi.fn(),
        clearPlaylist: vi.fn(),
        loadAndPlayTrack: vi.fn(),
      },
    });
    return renderTrack();
  };

  test('Add to Queue flags activity for the player to pulse', () => {
    renderWithPlayer();
    fireEvent.contextMenu(screen.getByText(/Test Track/).closest('.track-item'));
    fireEvent.click(screen.getByText('➕ Add to Queue'));
    const { playerInstance } = usePlayerStore.getState();
    expect(playerInstance.addTrack).toHaveBeenCalledWith(mockTrack, { flashActivity: true });
  });

  test('Play Next flags activity for the player to pulse', () => {
    renderWithPlayer();
    fireEvent.contextMenu(screen.getByText(/Test Track/).closest('.track-item'));
    fireEvent.click(screen.getByText('⏭ Play Next'));
    const { playerInstance } = usePlayerStore.getState();
    expect(playerInstance.addTracks).toHaveBeenCalledWith([mockTrack], true, { flashActivity: true });
  });

  test('Play Now does not flag activity (footer change is the feedback)', () => {
    renderWithPlayer();
    fireEvent.contextMenu(screen.getByText(/Test Track/).closest('.track-item'));
    fireEvent.click(screen.getByText('▶ Play Now'));
    const { playerInstance } = usePlayerStore.getState();
    expect(playerInstance.addTrack).toHaveBeenCalledWith(mockTrack);
    expect(playerInstance.addTracks).not.toHaveBeenCalled();
  });

  test('Add to Queue flashes the pressed button before the menu closes', () => {
    renderWithPlayer();
    fireEvent.contextMenu(screen.getByText(/Test Track/).closest('.track-item'));
    const button = screen.getByText('➕ Add to Queue');
    fireEvent.click(button);
    expect(button).toHaveClass('menu-btn-pressed');
  });

  test('Play Next flashes the pressed button before the menu closes', () => {
    renderWithPlayer();
    fireEvent.contextMenu(screen.getByText(/Test Track/).closest('.track-item'));
    const button = screen.getByText('⏭ Play Next');
    fireEvent.click(button);
    expect(button).toHaveClass('menu-btn-pressed');
  });

  test('Add to Queue starts playback at the newly added track\'s real index when paused', () => {
    // playerInstance.playlist already has 2 tracks (added elsewhere, never
    // synced into the Zustand store -- mirroring every real call site in
    // this codebase, which all call playerInstance.addTrack/addTracks
    // directly rather than the store's own wrapped actions).
    const loadAndPlayTrack = vi.fn();
    const playerInstance = {
      playlist: [{ id: 101 }, { id: 102 }],
      audioPlayer: { paused: true },
      currentTrackIndex: -1,
      addTrack: vi.fn((t) => { playerInstance.playlist.push(t); }),
      addTracks: vi.fn(),
      clearPlaylist: vi.fn(),
      loadAndPlayTrack,
    };
    usePlayerStore.setState({ playerInstance });
    // The store's own `playlist` field stays at its default (empty) --
    // exactly as it does in production, since nothing here calls the
    // store's addTrack action.
    renderTrack();

    fireEvent.contextMenu(screen.getByText(/Test Track/).closest('.track-item'));
    fireEvent.click(screen.getByText('➕ Add to Queue'));

    // After the push, the new track is at index 2. Reading the (always-stale)
    // store's playlist would have computed 0 - 1 = -1 instead.
    expect(loadAndPlayTrack).toHaveBeenCalledWith(2);
  });
});
