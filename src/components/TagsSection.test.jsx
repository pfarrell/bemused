import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import TagsSection from './TagsSection';
import { apiService } from '../services/api';

vi.mock('../services/api', () => ({
  apiService: {
    getArtistTags: vi.fn(),
    getAlbumTags: vi.fn(),
    getTags: vi.fn(),
    addTagToArtist: vi.fn(),
    addTagToAlbum: vi.fn(),
    removeTagFromArtist: vi.fn(),
    removeTagFromAlbum: vi.fn(),
  },
}));

const deferred = () => {
  let resolve;
  const promise = new Promise((r) => { resolve = r; });
  return { promise, resolve };
};

beforeEach(() => {
  vi.clearAllMocks();
  apiService.getArtistTags.mockResolvedValue({ data: [] });
});

describe('TagsSection', () => {
  test('shows suggestions typed while the tag list is still loading, once it arrives', async () => {
    const tagsFetch = deferred();
    apiService.getTags.mockReturnValue(tagsFetch.promise);

    render(<TagsSection entityType="artist" entityId={1} isLoggedIn={true} />);
    await waitFor(() => expect(apiService.getArtistTags).toHaveBeenCalled());

    const input = screen.getByPlaceholderText('add tag…');
    fireEvent.focus(input);
    // Typed before the tag list has come back from the server.
    fireEvent.change(input, { target: { value: 'roc' } });

    await act(async () => {
      tagsFetch.resolve({ data: [{ id: 1, name: 'rock' }, { id: 2, name: 'jazz' }] });
      await Promise.resolve();
    });

    expect(await screen.findByText('#rock')).toBeInTheDocument();
    expect(screen.queryByText('#jazz')).not.toBeInTheDocument();
  });

  test('clicking a suggestion adds the tag', async () => {
    apiService.getTags.mockResolvedValue({ data: [{ id: 1, name: 'rock' }] });
    apiService.addTagToArtist.mockResolvedValue({});

    render(<TagsSection entityType="artist" entityId={1} isLoggedIn={true} />);
    const input = screen.getByPlaceholderText('add tag…');
    fireEvent.focus(input);
    await waitFor(() => expect(apiService.getTags).toHaveBeenCalled());
    fireEvent.change(input, { target: { value: 'ro' } });

    fireEvent.mouseDown(await screen.findByText('#rock'));
    await waitFor(() => expect(apiService.addTagToArtist).toHaveBeenCalledWith(1, 'rock'));
  });

  test('does not crash when the tag list contains a null-named tag (malformed legacy data)', async () => {
    apiService.getTags.mockResolvedValue({ data: [{ id: 1, name: 'rock' }, { id: 2, name: null }] });

    render(<TagsSection entityType="artist" entityId={1} isLoggedIn={true} />);
    const input = screen.getByPlaceholderText('add tag…');
    fireEvent.focus(input);
    await waitFor(() => expect(apiService.getTags).toHaveBeenCalled());
    fireEvent.change(input, { target: { value: 'ro' } });

    expect(await screen.findByText('#rock')).toBeInTheDocument();
  });
});
