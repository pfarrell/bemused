import { render, screen, fireEvent } from '@testing-library/react';
import AlbumSortToggle from './AlbumSortToggle';
import { useAlbumSortStore } from '../stores/albumSortStore';

beforeEach(() => {
  useAlbumSortStore.setState({ sortBy: 'newest' });
});

describe('AlbumSortToggle', () => {
  test('renders Newest, Oldest and A–Z buttons with Newest pressed by default', () => {
    render(<AlbumSortToggle />);
    expect(screen.getByLabelText('Sort newest first')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Sort oldest first')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByLabelText('Sort alphabetically')).toHaveAttribute('aria-pressed', 'false');
  });

  test('clicking a button updates the store', () => {
    render(<AlbumSortToggle />);
    fireEvent.click(screen.getByLabelText('Sort oldest first'));
    expect(useAlbumSortStore.getState().sortBy).toBe('oldest');
    fireEvent.click(screen.getByLabelText('Sort alphabetically'));
    expect(useAlbumSortStore.getState().sortBy).toBe('alpha');
  });

  test('reflects the store value as pressed', () => {
    useAlbumSortStore.setState({ sortBy: 'alpha' });
    render(<AlbumSortToggle />);
    expect(screen.getByLabelText('Sort alphabetically')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Sort newest first')).toHaveAttribute('aria-pressed', 'false');
  });
});
