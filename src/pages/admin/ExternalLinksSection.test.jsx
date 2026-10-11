import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExternalLinksSection from './ExternalLinksSection';
import { apiService } from '../../services/api';

vi.mock('../../services/api', () => ({
  apiService: {
    getExternalLinks: vi.fn(),
    addExternalLink: vi.fn(),
    deleteExternalLink: vi.fn(),
    searchDiscogs: vi.fn(),
    fetchDiscogsCover: vi.fn(),
  },
}));

const link = { id: 1, source: 'discogs', kind: 'release', external_id: '77', url: 'https://www.discogs.com/release/77' };

beforeEach(() => {
  vi.clearAllMocks();
  apiService.getExternalLinks.mockResolvedValue({ data: [link] });
});

test('lists existing links', async () => {
  render(<ExternalLinksSection entityType="album" entityId="5" />);
  const a = await screen.findByRole('link', { name: 'Discogs (release)' });
  expect(a).toHaveAttribute('href', link.url);
});

test('adds a link with the chosen discogs kind and shows the returned list', async () => {
  const user = userEvent.setup();
  apiService.addExternalLink.mockResolvedValue({ data: [link, { ...link, id: 2, kind: 'master', external_id: '9', url: 'https://www.discogs.com/master/9' }] });
  render(<ExternalLinksSection entityType="album" entityId="5" />);
  await screen.findByRole('link', { name: 'Discogs (release)' });

  await user.type(screen.getByLabelText('External link URL or Discogs id'), '9');
  await user.selectOptions(screen.getByLabelText('Discogs id kind'), 'master');
  await user.click(screen.getByRole('button', { name: 'Add link' }));

  expect(apiService.addExternalLink).toHaveBeenCalledWith('album', '5', '9', { source: 'discogs', kind: 'master' });
  expect(await screen.findByRole('link', { name: 'Discogs (master)' })).toBeInTheDocument();
});

test('shows the server error when adding fails', async () => {
  const user = userEvent.setup();
  apiService.addExternalLink.mockRejectedValue({ response: { data: { error: 'Could not understand that link.' } } });
  render(<ExternalLinksSection entityType="artist" entityId="5" />);
  await user.type(screen.getByLabelText('External link URL or Discogs id'), 'junk');
  await user.click(screen.getByRole('button', { name: 'Add link' }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Could not understand'));
});

test('removes a link after confirming', async () => {
  const user = userEvent.setup();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  apiService.deleteExternalLink.mockResolvedValue({});
  render(<ExternalLinksSection entityType="album" entityId="5" />);
  await screen.findByRole('link', { name: 'Discogs (release)' });
  await user.click(screen.getByRole('button', { name: 'Remove' }));
  expect(apiService.deleteExternalLink).toHaveBeenCalledWith(1);
  await waitFor(() => expect(screen.queryByRole('link', { name: 'Discogs (release)' })).not.toBeInTheDocument());
});

test('finds on Discogs and links a result', async () => {
  const user = userEvent.setup();
  apiService.getExternalLinks.mockResolvedValue({ data: [] });
  apiService.searchDiscogs.mockResolvedValue({ data: { results: [
    { id: 5460, kind: 'master', title: 'Miles Davis - Kind Of Blue', year: '1959', country: 'US', label: 'Columbia', format: 'LP', thumb: null, url: 'https://www.discogs.com/master/5460' },
  ] } });
  apiService.addExternalLink.mockResolvedValue({ data: [{ id: 3, source: 'discogs', kind: 'master', external_id: '5460', url: 'https://www.discogs.com/master/5460' }] });
  render(<ExternalLinksSection entityType="album" entityId="5" />);

  await user.click(screen.getByRole('button', { name: 'Find on Discogs' }));
  expect(apiService.searchDiscogs).toHaveBeenCalledWith('album', '5', '');
  await screen.findByText('Miles Davis - Kind Of Blue');
  await user.click(screen.getByRole('button', { name: 'Link' }));

  expect(apiService.addExternalLink).toHaveBeenCalledWith('album', '5', '5460', { source: 'discogs', kind: 'master' });
  expect(await screen.findByRole('button', { name: 'Linked' })).toBeDisabled();
});

test('shows the server error when Discogs search fails', async () => {
  const user = userEvent.setup();
  apiService.searchDiscogs.mockRejectedValue({ response: { data: { error: 'DISCOGS_TOKEN is not set on the server' } } });
  render(<ExternalLinksSection entityType="album" entityId="5" />);
  await user.click(screen.getByRole('button', { name: 'Find on Discogs' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('DISCOGS_TOKEN');
});

test('Use cover is offered for album Discogs release links and calls the API', async () => {
  const user = userEvent.setup();
  apiService.fetchDiscogsCover.mockResolvedValue({ data: { success: true } });
  render(<ExternalLinksSection entityType="album" entityId="5" />);
  await user.click(await screen.findByRole('button', { name: 'Use cover' }));
  expect(apiService.fetchDiscogsCover).toHaveBeenCalledWith('5', 1);
  expect(await screen.findByRole('status')).toHaveTextContent('Cover saved');
});

test('Use cover is not offered on artists', async () => {
  render(<ExternalLinksSection entityType="artist" entityId="5" />);
  await screen.findByRole('link', { name: 'Discogs (release)' });
  expect(screen.queryByRole('button', { name: 'Use cover' })).not.toBeInTheDocument();
});
