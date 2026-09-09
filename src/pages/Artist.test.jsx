import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Artist from './Artist';
import { useAuthStore } from '../stores/authStore';
import { useFavoritesStore } from '../stores/favoritesStore';
import { apiService } from '../services/api';

vi.mock('../components/TagsSection', () => ({ default: () => null }));
vi.mock('../components/AddToCollectionModal', () => ({ default: () => null }));
vi.mock('../services/api', () => ({
  apiService: {
    getArtist: vi.fn(),
    getImageUrl: () => 'http://example.com/image.jpg',
  },
}));

const artistData = {
  artist: { id: 1, name: 'Test Artist', image_path: 'a.jpg' },
  summary: {},
  singles: [],
  appears_on: [],
  performances: [],
  related_artists: [],
  members: [],
  group_albums: [],
  similar_artists: [],
};

const renderArtist = () =>
  render(
    <MemoryRouter initialEntries={['/artist/1']}>
      <Routes>
        <Route path="/artist/:id" element={<Artist />} />
      </Routes>
    </MemoryRouter>
  );

const album = (id, title, release_year) => ({
  id,
  title,
  release_year,
  image_path: `${id}.jpg`,
  artist: { id: 1, name: 'Test Artist' },
  track_count: 10,
});

beforeEach(() => {
  useAuthStore.setState({ isAdmin: false, isAuthenticated: true });
  useFavoritesStore.setState({ isFavorite: () => false, toggleFavorite: vi.fn() });
});

describe('Artist page — Overtone menu item', () => {
  test('shows Overtone in the overflow menu when the artist has a musicbrainz_id', async () => {
    apiService.getArtist.mockResolvedValue({
      data: { ...artistData, artist: { ...artistData.artist, musicbrainz_id: 'abc-123' }, albums: [] },
    });
    renderArtist();
    await screen.findByText('Test Artist');

    await userEvent.click(screen.getByRole('button', { name: 'More options' }));

    expect(screen.getByRole('button', { name: '🔍 Overtone' })).toBeInTheDocument();
  });

  test('does not show Overtone in the overflow menu when the artist has no musicbrainz_id', async () => {
    apiService.getArtist.mockResolvedValue({ data: { ...artistData, albums: [] } });
    renderArtist();
    await screen.findByText('Test Artist');

    await userEvent.click(screen.getByRole('button', { name: 'More options' }));

    expect(screen.queryByRole('button', { name: '🔍 Overtone' })).not.toBeInTheDocument();
  });

  test('clicking Overtone opens it in a modal instead of navigating', async () => {
    apiService.getArtist.mockResolvedValue({
      data: { ...artistData, artist: { ...artistData.artist, musicbrainz_id: 'abc-123' }, albums: [] },
    });
    renderArtist();
    await screen.findByText('Test Artist');

    await userEvent.click(screen.getByRole('button', { name: 'More options' }));
    await userEvent.click(screen.getByRole('button', { name: '🔍 Overtone' }));

    expect(screen.getByTitle('Overtone')).toHaveAttribute('src', 'https://patf.com/overtone/entity/abc-123');
  });
});

describe('Artist page — dated/undated album divider', () => {
  test('renders a divider once when the album list mixes dated and undated albums', async () => {
    apiService.getArtist.mockResolvedValue({
      data: {
        ...artistData,
        albums: [
          album(1, 'Dated Two', '1975'),
          album(2, 'Dated One', '1970'),
          album(3, 'Undated A', null),
          album(4, 'Undated B', null),
        ],
      },
    });

    renderArtist();
    await screen.findByText('Dated Two');

    expect(document.querySelectorAll('.album-year-divider')).toHaveLength(1);
  });

  test('does not render a divider when every album has a year', async () => {
    apiService.getArtist.mockResolvedValue({
      data: {
        ...artistData,
        albums: [album(1, 'Dated Two', '1975'), album(2, 'Dated One', '1970')],
      },
    });

    renderArtist();
    await screen.findByText('Dated Two');

    expect(document.querySelectorAll('.album-year-divider')).toHaveLength(0);
  });

  test('does not render a divider when no album has a year', async () => {
    apiService.getArtist.mockResolvedValue({
      data: {
        ...artistData,
        albums: [album(1, 'Undated A', null), album(2, 'Undated B', '0')],
      },
    });

    renderArtist();
    await screen.findByText('Undated A');

    expect(document.querySelectorAll('.album-year-divider')).toHaveLength(0);
  });

  test('does not render a divider for a single-album list', async () => {
    apiService.getArtist.mockResolvedValue({
      data: {
        ...artistData,
        albums: [album(1, 'Only Album', null)],
      },
    });

    renderArtist();
    await screen.findByText('Only Album');

    expect(document.querySelectorAll('.album-year-divider')).toHaveLength(0);
  });
});

describe('Artist page — group discography sections', () => {
  test('renders a "With <Group>" section for each group in group_albums', async () => {
    apiService.getArtist.mockResolvedValue({
      data: {
        ...artistData,
        albums: [],
        group_albums: [
          { group: { id: 5, name: 'Crazy Horse' }, albums: [album(10, 'Zuma', '1975')] },
        ],
      },
    });

    renderArtist();
    await screen.findByText('Test Artist');

    expect(screen.getByText('With Crazy Horse')).toBeInTheDocument();
    expect(screen.getByText('Zuma')).toBeInTheDocument();
  });

  test('renders one section per group when the artist belongs to multiple groups', async () => {
    apiService.getArtist.mockResolvedValue({
      data: {
        ...artistData,
        albums: [],
        group_albums: [
          { group: { id: 5, name: 'Crazy Horse' }, albums: [album(10, 'Zuma', '1975')] },
          { group: { id: 6, name: 'CSNY' }, albums: [album(11, 'Deja Vu', '1970')] },
        ],
      },
    });

    renderArtist();
    await screen.findByText('Test Artist');

    expect(screen.getByText('With Crazy Horse')).toBeInTheDocument();
    expect(screen.getByText('With CSNY')).toBeInTheDocument();
  });

  test('navigates to the group\'s artist page when its section header is clicked', async () => {
    apiService.getArtist.mockResolvedValue({
      data: {
        ...artistData,
        albums: [],
        group_albums: [
          { group: { id: 5, name: 'Crazy Horse' }, albums: [album(10, 'Zuma', '1975')] },
        ],
      },
    });

    renderArtist();
    await screen.findByText('Test Artist');

    await userEvent.click(screen.getByText('With Crazy Horse'));

    await waitFor(() => expect(apiService.getArtist).toHaveBeenCalledWith('5'));
  });

  test('renders no group section when group_albums is empty', async () => {
    apiService.getArtist.mockResolvedValue({ data: { ...artistData, albums: [] } });

    renderArtist();
    await screen.findByText('Test Artist');

    expect(screen.queryByText(/^With /)).not.toBeInTheDocument();
  });

  test('does not render the old plain-text "Member of" list', async () => {
    apiService.getArtist.mockResolvedValue({
      data: {
        ...artistData,
        albums: [],
        group_albums: [
          { group: { id: 5, name: 'Crazy Horse' }, albums: [album(10, 'Zuma', '1975')] },
        ],
      },
    });

    renderArtist();
    await screen.findByText('Test Artist');

    expect(screen.queryByText(/Member of:/)).not.toBeInTheDocument();
  });
});

describe('Artist page — Performances section', () => {
  test('renders a Performances section from the performances field', async () => {
    apiService.getArtist.mockResolvedValue({
      data: {
        ...artistData,
        albums: [],
        performances: [{ ...album(20, 'Symphony No. 9', '1824'), artist: { id: 99, name: 'Berlin Philharmonic' } }],
      },
    });

    renderArtist();
    await screen.findByText('Test Artist');

    expect(screen.getByText('Performances')).toBeInTheDocument();
    expect(screen.getByText('Symphony No. 9')).toBeInTheDocument();
    expect(screen.getByText('Berlin Philharmonic')).toBeInTheDocument();
  });

  test('renders no Performances section when performances is empty', async () => {
    apiService.getArtist.mockResolvedValue({ data: { ...artistData, albums: [] } });

    renderArtist();
    await screen.findByText('Test Artist');

    expect(screen.queryByText('Performances')).not.toBeInTheDocument();
  });
});
