import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import TrackPage from './TrackPage';
import { usePlayerStore } from '../stores/playerStore';
import { useAuthStore } from '../stores/authStore';
import { useFavoritesStore } from '../stores/favoritesStore';
import { apiService } from '../services/api';
import { shareLink } from '../utils/shareLink';

vi.mock('../utils/shareLink', () => ({ shareLink: vi.fn() }));
vi.mock('../services/api', () => ({
  apiService: {
    getTrack: vi.fn(),
    getImageUrl: () => 'http://example.com/image.jpg',
  },
}));

const trackData = {
  track: {
    id: 1,
    title: 'Test Track',
    track_number: 1,
    duration: 245,
    artist: { id: 5, name: 'Test Artist' },
    album: { id: 10, title: 'Test Album', artist: { id: 5, name: 'Test Artist' } },
    image_path: 'a.jpg',
    url: 'http://example.com/stream/1',
    download_url: 'http://example.com/download/1',
  },
};

const renderTrackPage = () =>
  render(
    <MemoryRouter initialEntries={['/track/1']}>
      <Routes>
        <Route path="/track/:id" element={<TrackPage />} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  useAuthStore.setState({ isAdmin: false, isAuthenticated: true });
  useFavoritesStore.setState({ isFavorite: () => false, toggleFavorite: vi.fn() });
  usePlayerStore.setState({
    clearPlaylist: vi.fn(),
    addTrack: vi.fn(),
    setPageTracks: vi.fn(),
    currentTrack: null,
    playlist: [],
  });
  shareLink.mockClear();
});

test('shows a loading state before the track loads', () => {
  apiService.getTrack.mockReturnValue(new Promise(() => {})); // never resolves
  renderTrackPage();

  expect(screen.getByText('Loading track...')).toBeInTheDocument();
});

test('renders track title, artist, and album once loaded', async () => {
  apiService.getTrack.mockResolvedValue({ data: trackData });
  renderTrackPage();

  await screen.findByText('Test Track');

  expect(screen.getByText('Test Artist')).toBeInTheDocument();
  expect(screen.getByText('Test Album')).toBeInTheDocument();
});

test('shows an error state when the fetch fails', async () => {
  // A rejected request sets `error`, which the not-found branch prefers
  // over the literal 'Track not found' string — matching Album.jsx's
  // `{error || 'Album not found'}` pattern, where 'Album not found' only
  // shows for a resolved-but-empty response, not a network failure.
  apiService.getTrack.mockRejectedValue(new Error('404'));
  renderTrackPage();

  await screen.findByText('Failed to load track');
});

test('shows a not-found state when the API returns no track', async () => {
  apiService.getTrack.mockResolvedValue({ data: { track: null } });
  renderTrackPage();

  await screen.findByText('Track not found');
});

test('the hero play button clears the playlist and plays this track', async () => {
  const clearPlaylist = vi.fn();
  const addTrack = vi.fn();
  usePlayerStore.setState({ clearPlaylist, addTrack, setPageTracks: vi.fn(), currentTrack: null, playlist: [] });
  apiService.getTrack.mockResolvedValue({ data: trackData });
  renderTrackPage();
  await screen.findByText('Test Track');

  fireEvent.click(screen.getByRole('button', { name: 'Play' }));

  expect(clearPlaylist).toHaveBeenCalled();
  expect(addTrack).toHaveBeenCalledWith(trackData.track);
});

test('the share button shares the track title and artist', async () => {
  apiService.getTrack.mockResolvedValue({ data: trackData });
  renderTrackPage();
  await screen.findByText('Test Track');

  fireEvent.click(screen.getByRole('button', { name: 'Share' }));

  expect(shareLink).toHaveBeenCalledWith({ title: 'Test Track', text: 'Test Track — Test Artist' });
});

test('hides account-gated row actions when logged out', async () => {
  useAuthStore.setState({ isAdmin: false, isAuthenticated: false });
  apiService.getTrack.mockResolvedValue({ data: trackData });
  renderTrackPage();
  await screen.findByText('Test Track');

  // Query the row directly rather than by text: the header above also
  // contains "Test Track" (as the <h1>), so a text-based lookup here would
  // match two elements. There's exactly one .track-item on this page.
  fireEvent.contextMenu(document.querySelector('.track-item'));

  expect(screen.queryByText('📋 Add to Playlist')).not.toBeInTheDocument();
  expect(screen.queryByText(/Favorites/)).not.toBeInTheDocument();
});
