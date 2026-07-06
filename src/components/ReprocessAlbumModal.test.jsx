import { render, screen, waitFor, within } from '@testing-library/react';
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

  test('checkbox defaults to checked only when proposed differs from current', async () => {
    render(<ReprocessAlbumModal albumId={42} onClose={() => {}} onApplied={() => {}} />);
    await screen.findByDisplayValue('Motown Hits Vol. 1');

    // release_year: current 1975, proposed 1975 — unchanged, box should be unchecked
    const yearInput = screen.getByDisplayValue('1975');
    const yearRow = yearInput.closest('tr');
    expect(within(yearRow).getByRole('checkbox')).not.toBeChecked();

    // title: current 'Motown Hits', proposed 'Motown Hits Vol. 1' — changed, box should be checked
    const titleInput = screen.getByDisplayValue('Motown Hits Vol. 1');
    const titleRow = titleInput.closest('tr');
    expect(within(titleRow).getByRole('checkbox')).toBeChecked();
  });

  test('apply sends only checked/edited fields', async () => {
    apiService.applyReprocess.mockResolvedValue({ data: { success: true } });
    const onApplied = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<ReprocessAlbumModal albumId={42} onClose={onClose} onApplied={onApplied} />);
    await screen.findByDisplayValue('Motown Hits Vol. 1');

    await user.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => expect(apiService.applyReprocess).toHaveBeenCalled());
    const [calledAlbumId, payload] = apiService.applyReprocess.mock.calls[0];
    expect(calledAlbumId).toBe(42);
    expect(payload.album).toEqual({ title: 'Motown Hits Vol. 1' });
    expect(payload.tracks).toEqual([
      { id: 501, title: "Ain't No Mountain High Enough", artist_name: 'Marvin Gaye' },
    ]);
    expect(onApplied).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  test('editing a numeric field sends a number, not a string, in the apply payload', async () => {
    apiService.applyReprocess.mockClear();
    apiService.applyReprocess.mockResolvedValue({ data: { success: true } });
    const user = userEvent.setup();

    render(<ReprocessAlbumModal albumId={42} onClose={() => {}} onApplied={() => {}} />);
    await screen.findByDisplayValue('Motown Hits Vol. 1');

    // release_year starts unchecked (current === proposed); edit it and check the box.
    const yearInput = screen.getByDisplayValue('1975');
    await user.clear(yearInput);
    await user.type(yearInput, '1980');

    const yearRow = yearInput.closest('tr');
    const yearCheckbox = within(yearRow).getByRole('checkbox');
    expect(yearCheckbox).not.toBeChecked();
    await user.click(yearCheckbox);

    await user.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => expect(apiService.applyReprocess).toHaveBeenCalled());
    const [, payload] = apiService.applyReprocess.mock.calls[0];
    expect(payload.album.release_year).toBe(1980);
    expect(typeof payload.album.release_year).toBe('number');
  });

  test('artist checkbox defaults unchecked when proposed_name is null (no blank artist proposal)', async () => {
    apiService.getReprocessPreview.mockResolvedValue({
      data: {
        ...previewPayload,
        tracks: [
          {
            id: 502,
            fields: {
              title: { current: 'Track 2', proposed: 'Track 2' },
              track_number: { current: 2, proposed: 2 },
            },
            artist: {
              current: null,
              proposed_name: null,
              matched_artist: null,
            },
          },
        ],
      },
    });

    render(<ReprocessAlbumModal albumId={42} onClose={() => {}} onApplied={() => {}} />);
    await screen.findByDisplayValue('Track 2');

    // The artist checkbox lives in the track's row, alongside the title/track_number
    // checkboxes/inputs and the TrackArtistPicker. Find the row via the track title
    // input, then grab all checkboxes in that row — the last one is the artist checkbox.
    const titleInput = screen.getByDisplayValue('Track 2');
    const trackRow = titleInput.closest('tr');
    const checkboxes = within(trackRow).getAllByRole('checkbox');
    const artistCheckbox = checkboxes[checkboxes.length - 1];
    expect(artistCheckbox).not.toBeChecked();
  });

  test('apply omits a numeric field key entirely when cleared to empty, instead of sending an empty string', async () => {
    apiService.applyReprocess.mockClear();
    apiService.applyReprocess.mockResolvedValue({ data: { success: true } });
    const user = userEvent.setup();

    render(<ReprocessAlbumModal albumId={42} onClose={() => {}} onApplied={() => {}} />);
    await screen.findByDisplayValue('Motown Hits Vol. 1');

    // release_year starts unchecked (current === proposed); clear it to '' and check the box.
    const yearInput = screen.getByDisplayValue('1975');
    await user.clear(yearInput);

    const yearRow = yearInput.closest('tr');
    const yearCheckbox = within(yearRow).getByRole('checkbox');
    await user.click(yearCheckbox);
    expect(yearCheckbox).toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => expect(apiService.applyReprocess).toHaveBeenCalled());
    const [, payload] = apiService.applyReprocess.mock.calls[0];
    // release_year must be omitted, not sent as ''. The title change (which is
    // checked by default since proposed differs from current) must still go through.
    expect(payload.album).not.toHaveProperty('release_year');
    expect(payload.album.title).toBe('Motown Hits Vol. 1');
  });
});
