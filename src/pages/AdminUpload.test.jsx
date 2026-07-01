import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdminUpload from './AdminUpload';
import { apiService } from '../services/api';

vi.mock('../services/api', () => ({
  apiService: {
    getUploadStatus: vi.fn().mockResolvedValue({ data: { stats: { pending: 0, processing: 0, completed: 0, failed: 0 } } }),
    getRecentUploads: vi.fn().mockResolvedValue({ data: [] }),
    searchAdminArtists: vi.fn(),
    searchAdminAlbums: vi.fn(),
    uploadTracks: vi.fn(),
  },
}));

vi.mock('jsmediatags', () => ({
  default: {
    read: (file, callbacks) => {
      if (file.name === 'tagged.mp3') {
        callbacks.onSuccess({ tags: { title: 'My Song', artist: 'My Artist', album: 'My Album', track: '3' } });
      } else {
        callbacks.onSuccess({ tags: {} });
      }
    },
  },
}));

const renderUpload = () =>
  render(
    <MemoryRouter>
      <AdminUpload />
    </MemoryRouter>
  );

describe('AdminUpload — ID3 preview panel', () => {
  test('shows tag data after file selection', async () => {
    const user = userEvent.setup();
    renderUpload();

    const file = new File([''], 'tagged.mp3', { type: 'audio/mpeg' });
    await user.upload(document.getElementById('file-input'), file);

    await screen.findByText('My Song');
    expect(screen.getByText('My Artist')).toBeInTheDocument();
    expect(screen.getByText('My Album')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('falls back to filename (minus extension) as title when title tag is empty', async () => {
    const user = userEvent.setup();
    renderUpload();

    const file = new File([''], 'no-tags.mp3', { type: 'audio/mpeg' });
    await user.upload(document.getElementById('file-input'), file);

    await screen.findByText('no-tags');
    const dashes = await screen.findAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(3);
  });

  test('shows precedence note', async () => {
    const user = userEvent.setup();
    renderUpload();

    const file = new File([''], 'tagged.mp3', { type: 'audio/mpeg' });
    await user.upload(document.getElementById('file-input'), file);

    await screen.findByText(/Artist and album overrides above take precedence/i);
  });
});
