import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import JukeboxLibraryGrid from './JukeboxLibraryGrid';

vi.mock('../services/api', () => ({
  apiService: {
    getPlaylists: vi.fn(),
    getCollections: vi.fn(),
    getImageUrl: vi.fn((path) => (path ? `/img/${path}` : '')),
  },
}));

import { apiService } from '../services/api';

const playlists = [
  { id: 1, name: 'Zebra', track_count: 3, image_path: null, last_activity: '2026-10-01T00:00:00Z' },
  { id: 2, name: 'apple', track_count: 1, image_path: null, last_activity: '2026-10-09T00:00:00Z' },
  { id: 3, name: 'Mango', track_count: 5, image_path: null, last_activity: null },
];

const tileNames = () => screen.getAllByRole('button').map((b) => b.textContent.replace('♪', '')).filter((t) => /tracks?$|albums?$/.test(t));

beforeEach(() => {
  vi.clearAllMocks();
  apiService.getPlaylists.mockResolvedValue({ data: playlists });
});

test('lists playlists sorted A-Z by default, ignoring case', async () => {
  render(<JukeboxLibraryGrid kind="playlists" onSelectPlaylist={vi.fn()} />);
  await screen.findByText('Zebra');
  expect(tileNames()).toEqual(['apple1 track', 'Mango5 tracks', 'Zebra3 tracks']);
});

test('Recent sorts by last activity, newest first, with never-active items last', async () => {
  render(<JukeboxLibraryGrid kind="playlists" onSelectPlaylist={vi.fn()} />);
  await screen.findByText('Zebra');
  fireEvent.click(screen.getByRole('button', { name: 'Recent' }));
  expect(tileNames()).toEqual(['apple1 track', 'Zebra3 tracks', 'Mango5 tracks']);
  fireEvent.click(screen.getByRole('button', { name: 'A–Z' }));
  expect(tileNames()[0]).toBe('apple1 track');
});

test('collections use the collection endpoint and call onSelectCollection', async () => {
  const collection = { id: 7, name: 'Swing Era', album_count: 15, image_path: null, preview_albums: [{ id: 1, image_path: 'a.jpg' }] };
  apiService.getCollections.mockResolvedValue({ data: [collection] });
  const onSelectCollection = vi.fn();
  render(<JukeboxLibraryGrid kind="collections" onSelectCollection={onSelectCollection} />);
  const tile = await screen.findByText('Swing Era');
  expect(apiService.getPlaylists).not.toHaveBeenCalled();
  expect(tile.closest('button').querySelector('img')).toHaveAttribute('src', '/img/a.jpg');
  fireEvent.click(tile);
  expect(onSelectCollection).toHaveBeenCalledWith(collection);
});

test('shows an empty message, and an error with retry', async () => {
  apiService.getPlaylists.mockResolvedValueOnce({ data: [] });
  const { unmount } = render(<JukeboxLibraryGrid kind="playlists" onSelectPlaylist={vi.fn()} />);
  expect(await screen.findByText('No playlists yet')).toBeInTheDocument();
  unmount();

  apiService.getPlaylists.mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce({ data: playlists });
  render(<JukeboxLibraryGrid kind="playlists" onSelectPlaylist={vi.fn()} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));
  expect(await screen.findByText('Zebra')).toBeInTheDocument();
});

test('an item with a null name does not crash the grid and sorts first', async () => {
  apiService.getPlaylists.mockResolvedValue({ data: [playlists[0], { id: 9, name: null, track_count: 2, image_path: null, last_activity: null }] });
  render(<JukeboxLibraryGrid kind="playlists" onSelectPlaylist={vi.fn()} />);
  await screen.findByText('Zebra');
  expect(tileNames()).toEqual(['2 tracks', 'Zebra3 tracks']);
});
