import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Album from './Album';
import { usePlayerStore } from '../stores/playerStore';
import { useAuthStore } from '../stores/authStore';
import { apiService } from '../services/api';

vi.mock('../components/TagsSection', () => ({ default: () => null }));
vi.mock('../services/api', () => ({
  apiService: {
    getAlbum: vi.fn(),
    getImageUrl: () => 'http://example.com/image.jpg',
  },
}));

const albumData = {
  artist: { id: 5, name: 'Album Artist' },
  album: { id: 10, title: 'Test Album', image_path: 'a.jpg' },
  tracks: [
    { id: 1, title: 'Track One', duration: 180, artist: { name: 'Album Artist' }, album: { id: 10, title: 'Test Album', artist: { id: 5, name: 'Album Artist' } } },
    { id: 2, title: 'Track Two', duration: 200, artist: { name: 'Album Artist' }, album: { id: 10, title: 'Test Album', artist: { id: 5, name: 'Album Artist' } } },
  ],
  summary: {},
  secondary_artists: [],
};

const renderAlbum = () =>
  render(
    <MemoryRouter initialEntries={['/album/10']}>
      <Routes>
        <Route path="/album/:id" element={<Album />} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  apiService.getAlbum.mockResolvedValue({ data: albumData });
  useAuthStore.setState({ isAdmin: false, isAuthenticated: true });
});

describe('Album page', () => {
  test('Add to Queue starts playback without throwing when paused', async () => {
    const loadAndPlayTrack = vi.fn();
    const playerInstance = {
      playlist: [],
      audioPlayer: { paused: true },
      currentTrackIndex: -1,
      addTracks: vi.fn((tracks) => { playerInstance.playlist.push(...tracks); }),
      loadAndPlayTrack,
    };
    usePlayerStore.setState({ playerInstance, currentTrack: null });

    renderAlbum();
    await screen.findByText('Test Album');

    fireEvent.click(screen.getByText('Add to Queue'));

    expect(playerInstance.addTracks).toHaveBeenCalledWith(albumData.tracks, false);
    // Regression check: previously this threw "playerInstance.getPlaylist is not
    // a function" before loadAndPlayTrack was ever reached.
    expect(loadAndPlayTrack).toHaveBeenCalledWith(0);
  });

  test('Add to Queue does not auto-play when something is already playing', async () => {
    const loadAndPlayTrack = vi.fn();
    const playerInstance = {
      playlist: [{ id: 99, title: 'Already playing' }],
      audioPlayer: { paused: false },
      currentTrackIndex: 0,
      addTracks: vi.fn((tracks) => { playerInstance.playlist.push(...tracks); }),
      loadAndPlayTrack,
    };
    usePlayerStore.setState({ playerInstance, currentTrack: null });

    renderAlbum();
    await screen.findByText('Test Album');

    fireEvent.click(screen.getByText('Add to Queue'));

    expect(playerInstance.addTracks).toHaveBeenCalledWith(albumData.tracks, false);
    expect(loadAndPlayTrack).not.toHaveBeenCalled();
  });
});
