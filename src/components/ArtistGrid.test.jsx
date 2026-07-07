import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ArtistGrid from './ArtistGrid';

const renderGrid = (artists) =>
  render(
    <MemoryRouter>
      <ArtistGrid artists={artists} />
    </MemoryRouter>
  );

test('shows the album count when present', () => {
  renderGrid([{ id: 1, name: 'Test Artist', image_path: 'x.jpg', album_count: 5 }]);
  expect(screen.getByText('5 albums')).toBeInTheDocument();
});

test('uses singular "album" for a count of 1', () => {
  renderGrid([{ id: 1, name: 'Test Artist', image_path: 'x.jpg', album_count: 1 }]);
  expect(screen.getByText('1 album')).toBeInTheDocument();
});

test('does not render an album count when album_count is absent', () => {
  renderGrid([{ id: 1, name: 'Test Artist', image_path: 'x.jpg' }]);
  expect(screen.queryByText(/album/)).toBeNull();
});
