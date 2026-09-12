import { render, screen, fireEvent } from '@testing-library/react';
import ImageLightbox from './ImageLightbox';

test('renders the enlarged image with the given url and alt text', () => {
  render(<ImageLightbox imageUrl="http://example.com/big.jpg" alt="Test Album by Test Artist" onClose={vi.fn()} />);
  const img = screen.getByAltText('Test Album by Test Artist');
  expect(img).toHaveAttribute('src', 'http://example.com/big.jpg');
});

test('shows title and subtitle captions when provided', () => {
  render(<ImageLightbox imageUrl="x.jpg" alt="x" title="Test Album" subtitle="Test Artist" onClose={vi.fn()} />);
  expect(screen.getByText('Test Album')).toBeInTheDocument();
  expect(screen.getByText('Test Artist')).toBeInTheDocument();
});

test('omits the caption block entirely when no title or subtitle is given', () => {
  render(<ImageLightbox imageUrl="x.jpg" alt="x" onClose={vi.fn()} />);
  const img = screen.getByAltText('x');
  expect(img.parentElement.children.length).toBe(1);
});

test('calls onClose when the overlay is clicked', () => {
  const onClose = vi.fn();
  render(<ImageLightbox imageUrl="x.jpg" alt="x" onClose={onClose} />);
  fireEvent.click(screen.getByAltText('x').parentElement);
  expect(onClose).toHaveBeenCalled();
});

test('calls onClose when the enlarged image itself is clicked, matching existing lightbox behavior', () => {
  const onClose = vi.fn();
  render(<ImageLightbox imageUrl="x.jpg" alt="x" onClose={onClose} />);
  fireEvent.click(screen.getByAltText('x'));
  expect(onClose).toHaveBeenCalled();
});
