import { render, screen } from '@testing-library/react';
import ExternalLinks from './ExternalLinks';
import { apiService } from '../services/api';

vi.mock('../services/api', () => ({ apiService: { getExternalLinks: vi.fn() } }));

test('renders links as new-tab anchors', async () => {
  apiService.getExternalLinks.mockResolvedValue({ data: [
    { id: 1, source: 'discogs', kind: 'master', external_id: '9', url: 'https://www.discogs.com/master/9' },
    { id: 2, source: 'other', kind: 'page', external_id: 'x', url: 'https://www.example.com/a' },
  ] });
  render(<ExternalLinks entityType="album" entityId={3} />);
  const a = await screen.findByRole('link', { name: 'Discogs (master)' });
  expect(a).toHaveAttribute('target', '_blank');
  expect(screen.getByRole('link', { name: 'example.com' })).toBeInTheDocument();
});

test('renders nothing when there are no links or the call fails', async () => {
  apiService.getExternalLinks.mockRejectedValue(new Error('boom'));
  const { container } = render(<ExternalLinks entityType="artist" entityId={3} />);
  await Promise.resolve();
  expect(container).toBeEmptyDOMElement();
});
