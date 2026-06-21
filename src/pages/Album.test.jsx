import { render, screen, fireEvent } from '@testing-library/react';
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
  test('Add to Queue calls addTracks with flashActivity', async () => {
    const addTracks = vi.fn();
    usePlayerStore.setState({ addTracks, currentTrack: null });

    renderAlbum();
    await screen.findByText('Test Album');

    fireEvent.click(screen.getByText('Add to Queue'));

    expect(addTracks).toHaveBeenCalledWith(albumData.tracks, false, { flashActivity: true });
  });
});
