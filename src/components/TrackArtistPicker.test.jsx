import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TrackArtistPicker from './TrackArtistPicker';
import { apiService } from '../services/api';

vi.mock('../services/api', () => ({
  apiService: {
    searchAdminArtists: vi.fn(),
  },
}));

describe('TrackArtistPicker', () => {
  test('shows current artist name and a Change button', () => {
    render(<TrackArtistPicker artistId={5} artistName="Album Artist" onSelect={vi.fn()} />);
    expect(screen.getByText('Album Artist')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Change' })).toBeInTheDocument();
  });

  test('shows "Unassigned" when no artist is set', () => {
    render(<TrackArtistPicker artistId={null} artistName={null} onSelect={vi.fn()} />);
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  test('searching and picking a result calls onSelect with the artist id and name', async () => {
    apiService.searchAdminArtists.mockResolvedValue({
      data: [{ id: 42, name: 'Steppenwolf', album_count: 3 }],
    });
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<TrackArtistPicker artistId={5} artistName="Album Artist" onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: 'Change' }));
    await user.type(screen.getByPlaceholderText('Search artist name...'), 'Steppen');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    await screen.findByText('Steppenwolf');
    await user.click(screen.getByText('Steppenwolf'));

    expect(onSelect).toHaveBeenCalledWith(42, 'Steppenwolf');
  });

  test('Cancel returns to the read-only view without calling onSelect', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<TrackArtistPicker artistId={5} artistName="Album Artist" onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: 'Change' }));
    expect(screen.getByPlaceholderText('Search artist name...')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByPlaceholderText('Search artist name...')).not.toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });
});
