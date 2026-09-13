import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import AdminTags from './AdminTags';
import { apiService } from '../services/api';

vi.mock('../services/api', () => ({
  apiService: {
    getAdminTags: vi.fn(),
    deleteAdminTag: vi.fn(),
  },
}));

const tags = [
  { id: 1, name: 'rock', artist_count: 4, album_count: 6 },
  { id: 2, name: 'xss-lol', artist_count: 0, album_count: 0 },
];

beforeEach(() => {
  vi.clearAllMocks();
  apiService.getAdminTags.mockResolvedValue({ data: tags });
});

describe('AdminTags', () => {
  test('lists tags with usage counts', async () => {
    render(<AdminTags />);
    expect(await screen.findByText('#rock')).toBeInTheDocument();
    expect(screen.getByText('#xss-lol')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  test('filters the tag list by name', async () => {
    render(<AdminTags />);
    await screen.findByText('#rock');
    fireEvent.change(screen.getByPlaceholderText('filter tags…'), { target: { value: 'xss' } });
    expect(screen.queryByText('#rock')).not.toBeInTheDocument();
    expect(screen.getByText('#xss-lol')).toBeInTheDocument();
  });

  test('deletes a tag after confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    apiService.deleteAdminTag.mockResolvedValue({ data: { success: true } });
    render(<AdminTags />);
    await screen.findByText('#xss-lol');

    const row = screen.getByText('#xss-lol').closest('tr');
    fireEvent.click(within(row).getByText('Delete'));

    await waitFor(() => expect(apiService.deleteAdminTag).toHaveBeenCalledWith(2));
    await waitFor(() => expect(screen.queryByText('#xss-lol')).not.toBeInTheDocument());
    expect(screen.getByText('#rock')).toBeInTheDocument();
  });

  test('does not crash when a tag has a null name (malformed legacy data)', async () => {
    apiService.getAdminTags.mockResolvedValue({
      data: [...tags, { id: 3, name: null, artist_count: 50, album_count: 0 }],
    });
    render(<AdminTags />);
    expect(await screen.findByText('#rock')).toBeInTheDocument();
  });

  test('does not delete when confirmation is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<AdminTags />);
    const row = (await screen.findByText('#rock')).closest('tr');
    fireEvent.click(within(row).getByText('Delete'));

    expect(apiService.deleteAdminTag).not.toHaveBeenCalled();
    expect(screen.getByText('#rock')).toBeInTheDocument();
  });
});
