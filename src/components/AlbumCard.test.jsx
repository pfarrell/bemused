import { render, screen, fireEvent } from '@testing-library/react';
import AlbumCard from './AlbumCard';

vi.mock('./AddToCollectionModal', () => ({ default: () => null }));

const album = { id: 7, title: 'Test Album', image_path: 'x.jpg' };
const artist = { id: 3, name: 'Test Artist' };

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
