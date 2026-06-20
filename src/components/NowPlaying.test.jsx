import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NowPlaying from './NowPlaying';
import { usePlayerStore } from '../stores/playerStore';

// Matches the shape every backend route actually returns for a track:
// the album art path lives at the top level (image_path), never nested
// under album.image_path (the nested album object is id/title/artist only).
const track = {
  title: 'T', artist: { id: 1, name: 'A' },
  album: { id: 2, title: 'Alb' },
  image_path: 'a.jpg',
};

const renderNP = () => render(<MemoryRouter><NowPlaying /></MemoryRouter>);

beforeEach(() => {
  usePlayerStore.setState({ currentTrack: track, isLoading: false });
});

test('shows album art when the current track has an image_path', () => {
  renderNP();
  const img = screen.getByRole('img');
  expect(img.src).toContain('a.jpg');
});

test('falls back to the music-notes icon when the track has no image_path', () => {
  usePlayerStore.setState({ currentTrack: { ...track, image_path: null }, isLoading: false });
  renderNP();
  expect(screen.queryByRole('img')).toBeNull();
});

test('shows a loading spinner when isLoading is true', () => {
  usePlayerStore.setState({ currentTrack: track, isLoading: true });
  renderNP();
  expect(screen.getByTestId('now-playing-spinner')).toBeInTheDocument();
});

test('no spinner when not loading', () => {
  renderNP();
  expect(screen.queryByTestId('now-playing-spinner')).toBeNull();
});
