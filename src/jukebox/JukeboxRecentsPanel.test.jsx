import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import JukeboxRecentsPanel from './JukeboxRecentsPanel';
import { useProfileFilterStore } from '../stores/profileFilterStore';

vi.mock('../services/api', () => ({
  apiService: {
    getRecentAlbums: vi.fn(),
    getRecentPlaylists: vi.fn(),
    getRecentCollections: vi.fn(),
    getImageUrl: vi.fn(() => '/img/x.jpg'),
  },
}));

import { apiService } from '../services/api';

beforeEach(() => {
  vi.clearAllMocks();
  useProfileFilterStore.setState({ activeProfileId: null });
  apiService.getRecentAlbums.mockResolvedValue({
    data: [{ id: 1, title: 'Recent Album', image_path: 'a.jpg', artist: { id: 1, name: 'A' }, track_count: 3, last_played: '2026-10-01T00:00:00Z' }],
  });
  apiService.getRecentPlaylists.mockResolvedValue({ data: [] });
  apiService.getRecentCollections.mockResolvedValue({ data: [] });
});

test('shows recent items and calls onSelectAlbum when one is tapped', async () => {
  const onSelectAlbum = vi.fn();
  render(<JukeboxRecentsPanel onClose={vi.fn()} onSelectAlbum={onSelectAlbum} />);
  fireEvent.click(await screen.findByText('Recent Album'));
  expect(onSelectAlbum).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
});

test('the close button calls onClose', () => {
  const onClose = vi.fn();
  render(<JukeboxRecentsPanel onClose={onClose} />);
  fireEvent.click(screen.getByRole('button', { name: 'Close recent' }));
  expect(onClose).toHaveBeenCalled();
});

test('passes the active profile id to getRecentAlbums', async () => {
  useProfileFilterStore.setState({ activeProfileId: 5 });
  render(<JukeboxRecentsPanel onClose={vi.fn()} />);
  await waitFor(() => expect(apiService.getRecentAlbums).toHaveBeenCalledWith(20, 5));
});
