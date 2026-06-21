import { create } from 'zustand';

const validateTrack = (track) => {
  if (!track || !track.title || !track.url) {
    throw new Error('Invalid track object. Must contain at least title and url properties');
  }
};

export const usePlayerStore = create((set, get) => ({
  // DOM bridge — the raw <audio> element, set once by usePlayerEngine on mount.
  audioElement: null,
  setAudioElement: (audioElement) => set({ audioElement }),

  // Playback state
  playlist: [],
  currentTrackIndex: -1,
  currentTrack: null,
  isPlaying: false,
  isBuffering: false,
  currentTime: 0,
  duration: 0,
  playlistFinished: false,

  // Shuffle state
  shuffle: false,
  shuffleHistory: [],

  // UI state
  drawerOpen: false,
  activityPulseToken: 0,
  // Playlist positions (not track ids — the same track can legitimately
  // appear twice) from the most recent flashActivity add. Replaced wholesale
  // on each add (not merged) so only the latest batch flashes when the
  // drawer opens, and cleared by the drawer itself once shown so it doesn't
  // flash again.
  recentlyAddedIndices: [],
  clearRecentlyAdded: () => set({ recentlyAddedIndices: [] }),

  // Internal setters — called only by usePlayerEngine in response to <audio> events
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setBuffering: (isBuffering) => set({ isBuffering }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),

  // Transport
  playTrackAtIndex: (index) => {
    const { playlist, audioElement } = get();
    if (index < 0 || index >= playlist.length || !audioElement) return;
    const track = playlist[index];
    set({ currentTrackIndex: index, currentTrack: track, playlistFinished: false });
    audioElement.src = track.url;
    audioElement.load();
    audioElement.play().catch((error) => console.error('Playback failed:', error));
  },

  togglePlayPause: () => {
    const { audioElement, playlistFinished } = get();
    if (!audioElement) return;
    if (audioElement.paused) {
      if (playlistFinished) {
        get().playTrackAtIndex(0);
      } else {
        audioElement.play().catch((error) => console.error('Playback failed:', error));
      }
    } else {
      audioElement.pause();
    }
  },

  seek: (time) => {
    const { audioElement } = get();
    if (!audioElement) return;
    audioElement.currentTime = time;
  },

  playNext: () => {
    const { shuffle, shuffleHistory, playlist, currentTrackIndex, audioElement } = get();
    if (shuffle) {
      const remaining = playlist.map((_, i) => i).filter((i) => !shuffleHistory.includes(i));
      if (remaining.length === 0) {
        set({ playlistFinished: true });
        audioElement?.pause();
        return;
      }
      const nextIndex = remaining[Math.floor(Math.random() * remaining.length)];
      set({ shuffleHistory: [...shuffleHistory, nextIndex] });
      get().playTrackAtIndex(nextIndex);
      return;
    }
    if (currentTrackIndex === playlist.length - 1) {
      set({ playlistFinished: true });
      audioElement?.pause();
      return;
    }
    get().playTrackAtIndex(currentTrackIndex + 1);
  },

  playPrev: () => {
    const { shuffle, shuffleHistory, playlist, currentTrackIndex } = get();
    if (playlist.length === 0) return;
    set({ playlistFinished: false });
    if (shuffle && shuffleHistory.length > 1) {
      const newHistory = shuffleHistory.slice(0, -1);
      const prevIndex = newHistory[newHistory.length - 1];
      set({ shuffleHistory: newHistory });
      get().playTrackAtIndex(prevIndex);
      return;
    }
    const prevIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    get().playTrackAtIndex(prevIndex);
  },

  toggleShuffle: () => {
    const { shuffle, currentTrackIndex, playlist } = get();
    if (!shuffle) {
      let nextIndex = currentTrackIndex;
      if (playlist.length > 1) {
        do {
          nextIndex = Math.floor(Math.random() * playlist.length);
        } while (nextIndex === currentTrackIndex);
      }
      set({ shuffle: true, shuffleHistory: [nextIndex] });
      get().playTrackAtIndex(nextIndex);
    } else {
      set({ shuffle: false, shuffleHistory: [get().currentTrackIndex] });
    }
  },

  toggleDrawer: () => set((state) => ({ drawerOpen: !state.drawerOpen })),

  triggerActivityPulse: () => set((state) => ({ activityPulseToken: state.activityPulseToken + 1 })),

  // Queue management
  addTrack: (track, { flashActivity = false } = {}) => {
    validateTrack(track);
    const { playlist, isPlaying } = get();
    const newPlaylist = [...playlist, track];
    set({ playlist: newPlaylist });
    if (flashActivity) {
      set({ recentlyAddedIndices: [newPlaylist.length - 1] });
      get().triggerActivityPulse();
    }
    if (!isPlaying) {
      get().playTrackAtIndex(newPlaylist.length - 1);
    }
  },

  addTracks: (tracks, playNext = false, { flashActivity = false } = {}) => {
    if (!Array.isArray(tracks)) {
      throw new Error('Tracks must be provided as an array');
    }
    tracks.forEach(validateTrack);
    const { playlist, currentTrackIndex, isPlaying } = get();

    let newPlaylist;
    let startIndex;
    if (playNext && currentTrackIndex >= 0) {
      startIndex = currentTrackIndex + 1;
      newPlaylist = [...playlist.slice(0, startIndex), ...tracks, ...playlist.slice(startIndex)];
    } else {
      startIndex = playlist.length;
      newPlaylist = [...playlist, ...tracks];
    }

    set({ playlist: newPlaylist });
    if (flashActivity) {
      const newIndices = tracks.map((_, i) => startIndex + i);
      set({ recentlyAddedIndices: newIndices });
      get().triggerActivityPulse();
    }
    if (!isPlaying) {
      get().playTrackAtIndex(startIndex);
    }
  },

  clearPlaylist: () => {
    const { audioElement } = get();
    set({
      playlist: [],
      currentTrackIndex: -1,
      currentTrack: null,
      isPlaying: false,
      shuffleHistory: [],
      playlistFinished: false,
      currentTime: 0,
      duration: 0,
    });
    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
    }
  },

  removeTrackFromPlaylist: (index) => {
    const { playlist, currentTrackIndex, shuffle, shuffleHistory, audioElement } = get();
    if (index < 0 || index >= playlist.length || index === currentTrackIndex) return;

    const newPlaylist = playlist.filter((_, i) => i !== index);
    let newCurrentIndex = currentTrackIndex;
    if (index < currentTrackIndex) newCurrentIndex -= 1;

    let newShuffleHistory = shuffleHistory;
    if (shuffle && shuffleHistory.includes(index)) {
      newShuffleHistory = shuffleHistory.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i));
    }

    set({ playlist: newPlaylist, currentTrackIndex: newCurrentIndex, shuffleHistory: newShuffleHistory });

    if (newPlaylist.length === 0) {
      set({ currentTrackIndex: -1, currentTrack: null, isPlaying: false, currentTime: 0, duration: 0 });
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    }
  },

  reorderPlaylist: (fromIndex, toIndex) => {
    const { playlist, currentTrackIndex } = get();
    if (fromIndex === toIndex) return;
    const currentTrackRef = playlist[currentTrackIndex];
    const newPlaylist = [...playlist];
    const [moved] = newPlaylist.splice(fromIndex, 1);
    let insertIndex = toIndex;
    if (fromIndex < toIndex) {
      insertIndex = toIndex - 1;
    }
    newPlaylist.splice(insertIndex, 0, moved);
    const newCurrentIndex = currentTrackRef ? newPlaylist.indexOf(currentTrackRef) : -1;
    set({ playlist: newPlaylist, currentTrackIndex: newCurrentIndex });
  },

  setPlaylist: (tracks) => {
    get().clearPlaylist();
    if (tracks.length > 0) {
      get().addTracks(tracks);
    }
  },
}));
