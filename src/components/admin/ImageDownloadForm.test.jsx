import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ImageDownloadForm from './ImageDownloadForm';

vi.mock('../../services/api', () => ({
  apiService: { getImageUrl: (path) => `/img/${path}` },
}));

const fill = (url, name) => {
  fireEvent.change(screen.getByLabelText('Image URL'), { target: { value: url } });
  fireEvent.change(screen.getByLabelText('Save as Filename'), { target: { value: name } });
};
const button = () => screen.getByRole('button', { name: 'Download & Save Image' });

test('shows the current image only when there is one', () => {
  const { rerender } = render(<ImageDownloadForm imagePath={null} alt="Cover" onDownload={vi.fn()} />);
  expect(screen.queryByAltText('Cover')).not.toBeInTheDocument();
  rerender(<ImageDownloadForm imagePath="a.jpg" alt="Cover" onDownload={vi.fn()} />);
  expect(screen.getByAltText('Cover')).toHaveAttribute('src', '/img/a.jpg');
});

test('needs both fields, then downloads and clears them', async () => {
  const onDownload = vi.fn().mockResolvedValue();
  render(<ImageDownloadForm onDownload={onDownload} />);
  expect(button()).toBeDisabled();
  fill('https://example.com/x.jpg', 'x.jpg');
  fireEvent.click(button());
  await waitFor(() => expect(onDownload).toHaveBeenCalledWith('https://example.com/x.jpg', 'x.jpg'));
  await waitFor(() => expect(screen.getByLabelText('Image URL')).toHaveValue(''));
});

test('alerts the server error and keeps the fields on failure', async () => {
  const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const onDownload = vi.fn().mockRejectedValue({ response: { data: { error: 'Bad image' } } });
  render(<ImageDownloadForm onDownload={onDownload} />);
  fill('https://example.com/x.jpg', 'x.jpg');
  fireEvent.click(button());
  await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Bad image'));
  expect(screen.getByLabelText('Image URL')).toHaveValue('https://example.com/x.jpg');
});

test('does not submit an enclosing form', () => {
  const onSubmit = vi.fn((e) => e.preventDefault());
  render(<form onSubmit={onSubmit}><ImageDownloadForm onDownload={vi.fn().mockResolvedValue()} /></form>);
  fill('https://example.com/x.jpg', 'x.jpg');
  fireEvent.click(button());
  expect(onSubmit).not.toHaveBeenCalled();
});
