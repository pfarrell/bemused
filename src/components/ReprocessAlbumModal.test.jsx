import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReprocessAlbumModal from './ReprocessAlbumModal';
import { apiService } from '../services/api';

vi.mock('../services/api', () => ({
  apiService: {
    getReprocessPreview: vi.fn(),
    applyReprocess: vi.fn(),
    searchAdminArtists: vi.fn(),
  },
}));

const previewPayload = {
  album: {
    id: 42,
    is_compilation: true,
    fields: {
      title: { current: 'Motown Hits', proposed: 'Motown Hits Vol. 1' },
      release_year: { current: 1975, proposed: 1975 },
    },
  },
  tracks: [
    {
      id: 501,
      fields: {
        title: { current: 'Track 1', proposed: "Ain't No Mountain High Enough" },
        track_number: { current: 1, proposed: 1 },
      },
      artist: {
        current: { id: 12, name: 'Billy Preston' },
        proposed_name: 'Marvin Gaye',
        matched_artist: null,
      },
    },
  ],
  skipped: [{ track_id: 509, reason: 'file missing on disk' }],
};

describe('ReprocessAlbumModal', () => {
  beforeEach(() => {
    apiService.getReprocessPreview.mockResolvedValue({ data: previewPayload });
  });

  test('loads and renders the diff for album and track fields', async () => {
    render(<ReprocessAlbumModal albumId={42} onClose={() => {}} onApplied={() => {}} />);

    expect(await screen.findByDisplayValue('Motown Hits Vol. 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue("Ain't No Mountain High Enough")).toBeInTheDocument();
    expect(screen.getByText(/file missing on disk/)).toBeInTheDocument();
  });
});
