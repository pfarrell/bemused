import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import DriveMode from './DriveMode';
import { usePlayerStore } from '../stores/playerStore';
import { useProfileFilterStore } from '../stores/profileFilterStore';
import { runSearchCommand } from '../utils/searchCommands';
import { speakText, playChime } from '../utils/speech';

vi.mock('../utils/searchCommands', async (importOriginal) => ({
  ...(await importOriginal()),
  runSearchCommand: vi.fn(),
}));
vi.mock('../utils/speech', () => ({ speakText: vi.fn(), playChime: vi.fn() }));

// Stand-in for webkitSpeechRecognition (see useSpeechRecognition.test.js).
let recognizers;
class FakeRecognition {
  constructor() {
    this.start = vi.fn();
    this.stop = vi.fn();
    this.abort = vi.fn();
    recognizers.push(this);
  }
}
const hear = (text) => {
  const recognizer = recognizers[recognizers.length - 1];
  act(() => {
    if (text) recognizer.onresult({ results: [Object.assign([{ transcript: text }], { isFinal: true })] });
    recognizer.onend();
  });
};

const mockAudioElement = (paused = true) => ({
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
  load: vi.fn(),
  paused,
  src: '',
});

const LocationDisplay = () => <div data-testid="location">{useLocation().pathname}</div>;

const renderDriveMode = () =>
  render(
    <MemoryRouter initialEntries={['/album/9', '/drive']} initialIndex={1}>
      <Routes>
        <Route path="/drive" element={<DriveMode />} />
        <Route path="*" element={<div>previous page</div>} />
      </Routes>
      <LocationDisplay />
    </MemoryRouter>
  );

const micButton = () => screen.getByRole('button', { name: /tap to speak|listening|working/i });

let wakeLock;
let unlockForGesture;

beforeEach(() => {
  recognizers = [];
  vi.stubGlobal('webkitSpeechRecognition', FakeRecognition);
  wakeLock = { release: vi.fn().mockResolvedValue(undefined), addEventListener: vi.fn() };
  Object.defineProperty(navigator, 'wakeLock', {
    configurable: true,
    value: { request: vi.fn().mockResolvedValue(wakeLock) },
  });
  unlockForGesture = vi.fn();
  usePlayerStore.setState({
    audioElementA: mockAudioElement(),
    audioElementB: mockAudioElement(),
    activeSlot: 'a',
    currentTrack: null,
    isPlaying: false,
    unlockForGesture,
  });
  useProfileFilterStore.setState({ activeProfileId: null });
  runSearchCommand.mockReset();
  speakText.mockReset();
  playChime.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete navigator.wakeLock;
});

describe('DriveMode', () => {
  test("shows the current track's art, title, and artist", () => {
    usePlayerStore.setState({
      currentTrack: { id: 1, title: 'So What', image_path: 'kob.jpg', artist: { name: 'Miles Davis' }, album: { title: 'Kind of Blue' } },
    });
    renderDriveMode();

    expect(screen.getByText('So What')).toBeInTheDocument();
    expect(screen.getByText('Miles Davis')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Kind of Blue' })).toHaveAttribute('src', expect.stringContaining('kob.jpg'));
  });

  test('says nothing is playing when the queue is empty', () => {
    renderDriveMode();
    expect(screen.getByText('Nothing playing')).toBeInTheDocument();
  });

  test('keeps the screen awake while open', async () => {
    const { unmount } = renderDriveMode();
    await waitFor(() => expect(navigator.wakeLock.request).toHaveBeenCalledWith('screen'));

    unmount();
    expect(wakeLock.release).toHaveBeenCalled();
  });

  test('tapping chimes, unlocks audio, and starts listening', () => {
    renderDriveMode();
    fireEvent.click(micButton());

    expect(playChime).toHaveBeenCalled();
    expect(unlockForGesture).toHaveBeenCalled();
    expect(recognizers[0].start).toHaveBeenCalled();
    expect(micButton()).toHaveTextContent(/listening/i);
  });

  test('tapping while listening stops listening', () => {
    renderDriveMode();
    fireEvent.click(micButton());
    fireEvent.click(micButton());

    expect(recognizers[0].stop).toHaveBeenCalled();
    expect(recognizers).toHaveLength(1);
  });

  test('pauses music while listening and resumes it when nothing was heard', () => {
    const audio = mockAudioElement(false);
    usePlayerStore.setState({ audioElementA: audio, isPlaying: true });
    renderDriveMode();

    fireEvent.click(micButton());
    expect(audio.pause).toHaveBeenCalled();

    hear('');
    expect(speakText).toHaveBeenCalledWith("I didn't catch that");
    expect(audio.play).toHaveBeenCalled();
  });

  test('does not start music that was not playing before', () => {
    const audio = mockAudioElement(true);
    usePlayerStore.setState({ audioElementA: audio, isPlaying: false });
    renderDriveMode();

    fireEvent.click(micButton());
    hear('');

    expect(audio.pause).not.toHaveBeenCalled();
    expect(audio.play).not.toHaveBeenCalled();
  });

  test('explains the phrasing and resumes when what was heard is not a command', () => {
    const audio = mockAudioElement(false);
    usePlayerStore.setState({ audioElementA: audio, isPlaying: true });
    renderDriveMode();

    fireEvent.click(micButton());
    hear('kind of blue');

    expect(runSearchCommand).not.toHaveBeenCalled();
    expect(speakText).toHaveBeenCalledWith('Say play, then artist, album, playlist, or collection');
    expect(audio.play).toHaveBeenCalled();
  });

  test('runs a play command without leaving drive mode', async () => {
    useProfileFilterStore.setState({ activeProfileId: 4 });
    runSearchCommand.mockImplementation(async (command, { navigate }) => {
      navigate('/album/1');
      return { status: 'playing' };
    });
    renderDriveMode();

    fireEvent.click(micButton());
    hear('play album kind of blue');

    await waitFor(() => expect(micButton()).toHaveTextContent(/tap to speak/i));
    expect(runSearchCommand).toHaveBeenCalledWith(
      { type: 'album', query: 'kind of blue' },
      expect.objectContaining({ profileId: 4 }),
    );
    expect(screen.getByTestId('location')).toHaveTextContent('/drive');
  });

  test('resumes the old music when a command finds nothing', async () => {
    const audio = mockAudioElement(false);
    usePlayerStore.setState({ audioElementA: audio, isPlaying: true });
    runSearchCommand.mockResolvedValue({ status: 'not_found' });
    renderDriveMode();

    fireEvent.click(micButton());
    hear('play artist zzzz');

    await waitFor(() => expect(audio.play).toHaveBeenCalled());
  });

  test('ignores taps while a command is running', async () => {
    let finish;
    runSearchCommand.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    renderDriveMode();

    fireEvent.click(micButton());
    hear('play album kind of blue');
    expect(micButton()).toHaveTextContent(/working/i);
    fireEvent.click(micButton());
    expect(recognizers).toHaveLength(1);

    await act(async () => finish({ status: 'playing' }));
  });

  test('says so when the browser has no speech recognition', () => {
    vi.stubGlobal('webkitSpeechRecognition', undefined);
    renderDriveMode();

    fireEvent.click(micButton());

    expect(speakText).toHaveBeenCalledWith("Voice control isn't available in this browser");
  });

  test('Exit goes back to the previous page', () => {
    renderDriveMode();
    fireEvent.click(screen.getByRole('button', { name: 'Exit drive mode' }));
    expect(screen.getByText('previous page')).toBeInTheDocument();
  });
});
