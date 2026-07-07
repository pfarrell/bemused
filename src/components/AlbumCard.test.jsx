import { render, screen, fireEvent } from '@testing-library/react';
import AlbumCard from './AlbumCard';

vi.mock('./AddToCollectionModal', () => ({ default: () => null }));

const album = { id: 7, title: 'Test Album', image_path: 'x.jpg' };
const artist = { id: 3, name: 'Test Artist' };

test('shows a "+" after the artist name when the album has collaborators', () => {
  render(
    <AlbumCard
      album={{ ...album, has_collaborators: true }}
      artist={artist}
      onClick={vi.fn()}
      imageUrl="/img/sm/x.jpg"
    />
  );
  expect(screen.getByText('Test Artist +')).toBeInTheDocument();
});

test('does not show a "+" when the album has no collaborators', () => {
  render(
    <AlbumCard
      album={album}
      artist={artist}
      onClick={vi.fn()}
      imageUrl="/img/sm/x.jpg"
    />
  );
  expect(screen.getByText('Test Artist')).toBeInTheDocument();
});

test('tapping the cover image navigates via onClick, not an expand modal, even when a full image URL is supplied', () => {
  const onClick = vi.fn();
  render(
    <AlbumCard
      album={album}
      artist={artist}
      onClick={onClick}
      imageUrl="/img/sm/x.jpg"
      fullImageUrl="/img/full/x.jpg"
    />
  );

  fireEvent.click(screen.getByRole('img', { name: /Test Album/ }));

  expect(onClick).toHaveBeenCalledWith(album);
  // No full-screen zoom overlay should exist, even though a fullImageUrl was provided
  expect(document.querySelector('[style*="zoom-out"]')).toBeNull();
});

test('shows the track count when present', () => {
  render(
    <AlbumCard
      album={{ ...album, track_count: 12 }}
      artist={artist}
      onClick={vi.fn()}
      imageUrl="/img/sm/x.jpg"
    />
  );
  expect(screen.getByText('12 tracks')).toBeInTheDocument();
});

test('uses singular "track" for a count of 1', () => {
  render(
    <AlbumCard
      album={{ ...album, track_count: 1 }}
      artist={artist}
      onClick={vi.fn()}
      imageUrl="/img/sm/x.jpg"
    />
  );
  expect(screen.getByText('1 track')).toBeInTheDocument();
});

test('does not render a track count when track_count is absent', () => {
  render(
    <AlbumCard
      album={album}
      artist={artist}
      onClick={vi.fn()}
      imageUrl="/img/sm/x.jpg"
    />
  );
  expect(screen.queryByText(/track/)).toBeNull();
});
