import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AdminAlbum from './AdminAlbum';
import { apiService } from '../services/api';

vi.mock('../components/TagsSection', () => ({ default: () => null }));
vi.mock('../services/api', () => ({
  apiService: {
    getAlbum: vi.fn(),
    getAlbumImages: vi.fn(),
    getAlbumSecondaryArtists: vi.fn(),
    updateAlbum: vi.fn(),
    updateTrack: vi.fn(),
    searchAdminArtists: vi.fn(),
  },
}));

const albumPayload = {
  album: {
    id: 10,
    title: 'Easy Rider',
    artist_id: 161,
    is_compilation: true,
    release_year: '1969',
    image_path: null,
    wikipedia: null,
    mbid_status: null,
  },
  artist: { id: 161, name: 'Various Artists' },
  tracks: [
    { id: 1, title: 'Born to Be Wild', track_number: '1', duration: 180, album: { id: 10 }, artist: { id: 200, name: 'Steppenwolf' } },
  ],
};

const renderAdminAlbum = () =>
  render(
    <MemoryRouter initialEntries={['/admin/album/10']}>
      <Routes>
        <Route path="/admin/album/:id" element={<AdminAlbum />} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  apiService.getAlbum.mockResolvedValue({ data: albumPayload });
  apiService.getAlbumImages.mockResolvedValue({ data: [] });
  apiService.getAlbumSecondaryArtists.mockResolvedValue({ data: [] });
});

describe('AdminAlbum — compilation checkbox', () => {
  test('reflects the loaded is_compilation value', async () => {
    renderAdminAlbum();
    const checkbox = await screen.findByLabelText('Is compilation');
    expect(checkbox).toBeChecked();
  });

  test('saving sends the toggled is_compilation value', async () => {
    apiService.updateAlbum.mockResolvedValue({ data: {} });
    const user = userEvent.setup();
    renderAdminAlbum();

    const checkbox = await screen.findByLabelText('Is compilation');
    await user.click(checkbox);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(apiService.updateAlbum).toHaveBeenCalledWith(
      '10',
      expect.objectContaining({ is_compilation: false })
    ));
  });
});

describe('AdminAlbum — per-track artist picker', () => {
  test('shows the current track artist name', async () => {
    renderAdminAlbum();
    await screen.findByDisplayValue('Easy Rider');
    expect(screen.getByText('Steppenwolf')).toBeInTheDocument();
  });

  test('picking a new artist saves it via updateTrack', async () => {
    apiService.updateTrack.mockResolvedValue({ data: {} });
    apiService.searchAdminArtists.mockResolvedValue({ data: [{ id: 300, name: 'The Electric Prunes' }] });
    const user = userEvent.setup();
    renderAdminAlbum();

    await screen.findByDisplayValue('Easy Rider');
    await user.click(screen.getByRole('button', { name: 'Change' }));
    const artistInput = screen.getByPlaceholderText('Search artist name...');
    await user.type(artistInput, 'Electric');
    await user.click(within(artistInput.closest('div')).getByRole('button', { name: 'Search' }));
    await screen.findByText('The Electric Prunes');
    await user.click(screen.getByText('The Electric Prunes'));

    expect(apiService.updateTrack).toHaveBeenCalledWith(1, { artist_id: 300 });
  });
});
