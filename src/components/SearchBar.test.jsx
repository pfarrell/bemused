import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import SearchBar from './SearchBar';
import { usePlayerStore } from '../stores/playerStore';
import { useProfileFilterStore } from '../stores/profileFilterStore';
import { runSearchCommand } from '../utils/searchCommands';

vi.mock('../utils/searchCommands', async (importOriginal) => ({
  ...(await importOriginal()),
  runSearchCommand: vi.fn(),
}));

// Captures the current location so we can assert navigation happened
const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname + location.search}</div>;
};

const renderSearchBar = () =>
  render(
    <MemoryRouter>
      <SearchBar />
      <LocationDisplay />
    </MemoryRouter>
  );

describe('SearchBar', () => {
  test('renders the search input', () => {
    renderSearchBar();
    expect(
      screen.getByPlaceholderText('Search for songs, artists, or albums')
    ).toBeInTheDocument();
  });

  test('navigates to /search?q=... on form submit', async () => {
    const user = userEvent.setup();
    renderSearchBar();

    await user.type(
      screen.getByPlaceholderText('Search for songs, artists, or albums'),
      'pink floyd'
    );
    await user.keyboard('{Enter}');

    expect(screen.getByTestId('location')).toHaveTextContent(
      '/search?q=pink%20floyd'
    );
  });

  test('does not navigate when query is empty', async () => {
    const user = userEvent.setup();
    renderSearchBar();

    await user.keyboard('{Enter}');

    expect(screen.getByTestId('location')).toHaveTextContent('/');
  });

  test('does not navigate when query is only whitespace', async () => {
    const user = userEvent.setup();
    renderSearchBar();

    await user.type(
      screen.getByPlaceholderText('Search for songs, artists, or albums'),
      '   '
    );
    await user.keyboard('{Enter}');

    expect(screen.getByTestId('location')).toHaveTextContent('/');
  });

  test('shows a clear button only once there is text, and clears it on click', async () => {
    const user = userEvent.setup();
    renderSearchBar();
    const input = screen.getByPlaceholderText(
      'Search for songs, artists, or albums'
    );

    expect(
      screen.queryByRole('button', { name: 'Clear search' })
    ).not.toBeInTheDocument();

    await user.type(input, 'pink floyd');
    const clearButton = screen.getByRole('button', { name: 'Clear search' });
    expect(clearButton).toBeInTheDocument();

    await user.click(clearButton);

    expect(input).toHaveValue('');
    expect(
      screen.queryByRole('button', { name: 'Clear search' })
    ).not.toBeInTheDocument();
  });

  test('closes the playlist drawer on submit', async () => {
    const closeDrawer = vi.fn();
    usePlayerStore.setState({ closeDrawer });
    const user = userEvent.setup();
    renderSearchBar();

    await user.type(
      screen.getByPlaceholderText('Search for songs, artists, or albums'),
      'pink floyd'
    );
    await user.keyboard('{Enter}');

    expect(closeDrawer).toHaveBeenCalled();
  });

  describe('play commands', () => {
    beforeEach(() => {
      runSearchCommand.mockReset();
    });

    test('runs a play command instead of searching, passing the active profile', async () => {
      useProfileFilterStore.setState({ activeProfileId: 4 });
      runSearchCommand.mockResolvedValue({ status: 'playing' });
      const user = userEvent.setup();
      renderSearchBar();

      await user.type(screen.getByPlaceholderText('Search for songs, artists, or albums'), 'Play album OK Computer.');
      await user.keyboard('{Enter}');

      expect(runSearchCommand).toHaveBeenCalledWith(
        { type: 'album', query: 'OK Computer' },
        expect.objectContaining({ profileId: 4, navigate: expect.any(Function) })
      );
      expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/);
      useProfileFilterStore.setState({ activeProfileId: null });
    });

    test('the command navigates with the app router', async () => {
      runSearchCommand.mockImplementation(async (_cmd, { navigate }) => {
        navigate('/artist/3');
        return { status: 'playing' };
      });
      const user = userEvent.setup();
      renderSearchBar();

      await user.type(screen.getByPlaceholderText('Search for songs, artists, or albums'), 'play artist radiohead');
      await user.keyboard('{Enter}');

      await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/artist/3'));
    });

    test('clears the input after a command starts playing', async () => {
      runSearchCommand.mockResolvedValue({ status: 'playing' });
      const user = userEvent.setup();
      renderSearchBar();
      const input = screen.getByPlaceholderText('Search for songs, artists, or albums');

      await user.type(input, 'play artist radiohead');
      await user.keyboard('{Enter}');

      await waitFor(() => expect(input).toHaveValue(''));
    });

    test('keeps the input text when nothing matched', async () => {
      runSearchCommand.mockResolvedValue({ status: 'not_found' });
      const user = userEvent.setup();
      renderSearchBar();
      const input = screen.getByPlaceholderText('Search for songs, artists, or albums');

      await user.type(input, 'play album nothing here');
      await user.keyboard('{Enter}');

      await waitFor(() => expect(runSearchCommand).toHaveBeenCalled());
      expect(input).toHaveValue('play album nothing here');
      expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/);
    });

    test('a plain "play X" is still a normal search', async () => {
      const user = userEvent.setup();
      renderSearchBar();

      await user.type(screen.getByPlaceholderText('Search for songs, artists, or albums'), 'play that funky music');
      await user.keyboard('{Enter}');

      expect(runSearchCommand).not.toHaveBeenCalled();
      expect(screen.getByTestId('location')).toHaveTextContent('/search?q=play%20that%20funky%20music');
    });
  });
});

