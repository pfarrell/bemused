import { render, screen } from '@testing-library/react';
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
});
