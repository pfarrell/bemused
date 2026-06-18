import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NowPlaying from './NowPlaying';
import { usePlayerStore } from '../stores/playerStore';

const track = {
  title: 'T', artist: { id: 1, name: 'A' },
  album: { id: 2, title: 'Alb', image_path: 'a.jpg' },
};

const renderNP = () => render(<MemoryRouter><NowPlaying /></MemoryRouter>);

beforeEach(() => {
  usePlayerStore.setState({ currentTrack: track, isLoading: false });
});

test('shows a loading spinner when isLoading is true', () => {
  usePlayerStore.setState({ currentTrack: track, isLoading: true });
  renderNP();
  expect(screen.getByTestId('now-playing-spinner')).toBeInTheDocument();
});

test('no spinner when not loading', () => {
  renderNP();
  expect(screen.queryByTestId('now-playing-spinner')).toBeNull();
});
