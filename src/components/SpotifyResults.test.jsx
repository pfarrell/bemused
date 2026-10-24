import { render, screen, fireEvent } from '@testing-library/react';
import SpotifyResults from './SpotifyResults';
import { usePlayerStore } from '../stores/playerStore';
import { useViewModeStore } from '../stores/viewModeStore';

beforeEach(() => {
  useViewModeStore.setState({ mode: 'card' });
});

test('renders nothing when every group is empty', () => {
  const { container } = render(<SpotifyResults artists={[]} albums={[]} tracks={[]} />);
  expect(container).toBeEmptyDOMElement();
});

test('renders only a loading indicator while pending', () => {
  render(<SpotifyResults loading />);
  expect(screen.getByTestId('spotify-loading')).toBeInTheDocument();
  expect(screen.queryByText('From Spotify')).toBeNull();
});

test('omits empty groups', () => {
  render(<SpotifyResults artists={[{ id: 'r', name: 'Only Artist', imageUrl: null, externalUrl: 'https://open.spotify.com/artist/r' }]} />);
  expect(screen.getByText('Artists')).toBeInTheDocument();
  expect(screen.queryByText('Albums')).toBeNull();
  expect(screen.queryByText('Tracks')).toBeNull();
});

test('labels cards as Spotify in card mode and renders rows in list mode', () => {
  const albums = [{ id: 'a', name: 'Some Album', artists: [{ name: 'X' }], imageUrl: null, externalUrl: 'https://open.spotify.com/album/a' }];
  const { container, rerender } = render(<SpotifyResults albums={albums} />);
  expect(screen.getByText('SPOTIFY')).toBeInTheDocument();
  expect(container.querySelector('.artist-card.spotify-result')).not.toBeNull();

  useViewModeStore.setState({ mode: 'list' });
  rerender(<SpotifyResults albums={albums} />);
  expect(container.querySelector('.result-row.spotify-result')).not.toBeNull();
  expect(screen.getByRole('link', { name: 'Open Some Album in Spotify' })).toBeInTheDocument();
});

test('falls back to a placeholder when an image fails to load', () => {
  const { container } = render(
    <SpotifyResults albums={[{ id: 'a', name: 'Broken Art', artists: [], imageUrl: 'https://i.scdn.co/broken.jpg', externalUrl: 'https://open.spotify.com/album/a' }]} />
  );
  fireEvent.error(screen.getByAltText('Broken Art'));
  expect(screen.queryByAltText('Broken Art')).toBeNull();
  expect(container.querySelector('.spotify-image-fallback')).not.toBeNull();
});

test('never renders a non-string name as a child', () => {
  render(<SpotifyResults artists={[{ id: 'r', name: { bogus: true }, imageUrl: null }]} />);
  expect(screen.getByText('Artists')).toBeInTheDocument();
});

test('clicking a Spotify item does not touch the player queue', () => {
  const before = usePlayerStore.getState().playlist;
  render(<SpotifyResults tracks={[{ id: 't', name: 'Ext Track', artists: [{ name: 'A' }], album: { name: 'B', imageUrl: null }, durationMs: 1000, externalUrl: 'https://open.spotify.com/track/t' }]} />);
  fireEvent.click(screen.getByText('Ext Track'));
  expect(usePlayerStore.getState().playlist).toBe(before);
});
