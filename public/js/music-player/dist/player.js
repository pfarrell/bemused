// player.js
const PLAY_SYMBOL = '&#9205;';
const PAUSE_SYMBOL = '&#9208;';
const PREV_SYMBOL = '&#9194;';
const NEXT_SYMBOL = '&#9193;';
const SHUFFLE_SYMBOL = '&#128256;';
const DRAG_HANDLE = '&#8942;';

function AudioPlayer(playlist, audioElement, containerElement, playlistElement, config = {}) {
  this.playlist = playlist || [];
  this.currentTrackIndex = -1;
  this.shuffle = config.shuffle || false;
  this.shuffleHistory = [];
  this.audioPlayer = audioElement;
  this.container = containerElement;
  this.playlistElement = playlistElement;
  this.onTrackStart = config.onTrackStart || function() {};
  this.onFiveSecondMark = config.onFiveSecondMark || function() {};
  this.getTrackPrefix = config.getTrackPrefix || (() => '');
  this.draggedItem = null;
  this.draggedItemIndex = null;
  // Add a new property to track if playlist is finished
  this.playlistFinished = false;

  if (!this.container) {
    throw new Error('Container element not found');
  }

  this.init();
}

AudioPlayer.prototype.init = function() {
  this.audioPlayer.controls = false;
  this.container.appendChild(this.audioPlayer);

  this.controlsContainer = document.createElement('div');
  this.controlsContainer.className = 'controls';
  this.container.appendChild(this.controlsContainer);

  this.createControls();
  
  this.trackListElement = document.createElement('ul');
  this.trackListElement.className = 'playlist';
  this.trackListElement.style.textAlign = 'left';
  this.playlistElement.appendChild(this.trackListElement);

  this.attachAudioPlayerListeners();
  this.loadPlaylistUI();
  this.loadAndPlayTrack(this.currentTrackIndex);
};

AudioPlayer.prototype.createControls = function() {
  const controlsWrapper = document.createElement('div');
  controlsWrapper.style.display = 'flex';
  controlsWrapper.style.justifyContent = 'center';
  controlsWrapper.style.alignItems = 'center';

  this.prevButtonElement = this.createPrevButton();
  this.playButtonElement = this.createPlayButton();

  this.timeElapsedDisplay = document.createElement('span');
  this.timeElapsedDisplay.classList.add('time-display', 'elapsed');
  this.timeElapsedDisplay.style.marginLeft = '10px';
  this.timeElapsedDisplay.textContent = '0:00';

  const progressBarWrapper = this.createProgressBar();

  this.trackLengthDisplay = document.createElement('span');
  this.trackLengthDisplay.classList.add('time-display', 'total');
  this.trackLengthDisplay.style.marginRight = '10px';
  this.trackLengthDisplay.textContent = '0:00';

  this.nextButtonElement = this.createNextButton();
  this.shuffleToggleElement = this.createShuffleToggle();

  controlsWrapper.appendChild(progressBarWrapper);
  controlsWrapper.appendChild(this.timeElapsedDisplay);
  controlsWrapper.appendChild(this.trackLengthDisplay);
  controlsWrapper.appendChild(this.prevButtonElement);
  controlsWrapper.appendChild(this.playButtonElement);
  controlsWrapper.appendChild(this.nextButtonElement);
  controlsWrapper.appendChild(this.shuffleToggleElement);

  this.controlsContainer.appendChild(controlsWrapper);
};

AudioPlayer.prototype.createPrevButton = function() {
  const prevButton = document.createElement('button');
  prevButton.innerHTML = PREV_SYMBOL;
  prevButton.className = 'player-btn';
  prevButton.addEventListener('click', () => this.playPrevTrack());
  return prevButton;
};

AudioPlayer.prototype.createPlayButton = function() {
  const playButton = document.createElement('button');
  playButton.innerHTML = PLAY_SYMBOL;
  playButton.className = 'play-btn player-btn';
  playButton.addEventListener('click', () => {
    if (this.audioPlayer.paused) {
      // If playlist has finished, start from the first track
      if (this.playlistFinished) {
        this.playlistFinished = false;
        this.loadAndPlayTrack(0);
      } else {
        // Otherwise just play the current track
        this.audioPlayer.play();
      }
    } else {
      this.audioPlayer.pause();
    }
  });
  return playButton;
};

AudioPlayer.prototype.createNextButton = function() {
  const nextButton = document.createElement('button');
  nextButton.innerHTML = NEXT_SYMBOL;
  nextButton.className = 'player-btn';
  nextButton.addEventListener('click', () => this.playNextTrack());
  return nextButton;
};

AudioPlayer.prototype.createShuffleToggle = function() {
  const shuffleToggle = document.createElement('button');
  shuffleToggle.innerHTML = SHUFFLE_SYMBOL;
  shuffleToggle.className = 'player-btn';
  shuffleToggle.style.opacity = '0.5';
  shuffleToggle.style.transition = 'all 0.2s ease';

  shuffleToggle.addEventListener('click', () => {
    this.shuffle = !this.shuffle;
    shuffleToggle.style.opacity = this.shuffle ? '1' : '0.5';
    shuffleToggle.style.backgroundColor = this.shuffle ? '#007acc' : '';
    shuffleToggle.style.color = this.shuffle ? 'white' : '';

    if (this.shuffle) {
      this.shufflePlaylist();
    } else {
      this.unshufflePlaylist();
    }
  });
  return shuffleToggle;
};

AudioPlayer.prototype.shufflePlaylist = function() {
  // Save original order if not already saved
  if (!this.originalPlaylist) {
    this.originalPlaylist = [...this.playlist];
  }

  // Fisher-Yates shuffle algorithm
  const shuffled = [...this.playlist];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Remember current track
  const currentTrack = this.playlist[this.currentTrackIndex];

  // Update playlist with shuffled version
  this.playlist = shuffled;

  // Find new index of current track
  this.currentTrackIndex = this.playlist.findIndex(track =>
    track.url === currentTrack.url && track.title === currentTrack.title);

  // Update the UI
  this.loadPlaylistUI();
}

AudioPlayer.prototype.unshufflePlaylist = function() {
  if (this.originalPlaylist) {
    // Remember current track
    const currentTrack = this.playlist[this.currentTrackIndex];

    // Restore original playlist
    this.playlist = [...this.originalPlaylist];

    // Find new position of current track
    this.currentTrackIndex = this.playlist.findIndex(track =>
      track.url === currentTrack.url && track.title === currentTrack.title);

    // Update the UI
    this.loadPlaylistUI();

    // Clear original playlist reference
    this.originalPlaylist = null;
  }
}

AudioPlayer.prototype.createProgressBar = function() {
  const progressBarWrapper = document.createElement('div');
  progressBarWrapper.style.flexGrow = '1';
  progressBarWrapper.style.position = 'relative';

  const progressBar = document.createElement('input');
  progressBar.type = 'range';
  progressBar.min = '0';
  progressBar.max = '100';
  progressBar.value = '0';
  progressBar.style.width = '100%';
  progressBar.addEventListener('input', (e) => {
    const percent = e.target.value / 100;
    this.audioPlayer.currentTime = percent * this.audioPlayer.duration;
  });

  progressBarWrapper.appendChild(progressBar);
  return progressBarWrapper;
};

AudioPlayer.prototype.highlightFirstTrack = function() {
  // Only proceed if we have tracks in the playlist
  if (this.playlist.length > 0) {
    // Set visual indication that first track is selected
    Array.from(this.trackListElement.children).forEach((item, idx) => {
      item.classList.toggle('active', idx === 0);
    });
    
    // Don't change actual current track index until play is pressed
    // This way we don't lose our position in the playlist
  }
};

AudioPlayer.prototype.attachAudioPlayerListeners = function() {
  this.audioPlayer.addEventListener('ended', () => {
    // Check if we're at the last track
    if (!this.shuffle && this.currentTrackIndex === this.playlist.length - 1) {
      this.playlistFinished = true;
      // Don't automatically start over, just update the UI
      this.updatePlayButton();
      // Highlight the first track in the playlist
      this.highlightFirstTrack();
    } else {
      // Not the last track or in shuffle mode, proceed to next track
      this.playNextTrack();
    }
  });
  
  this.audioPlayer.addEventListener('timeupdate', () => {
    if (this.audioPlayer.currentTime >= 5 && !this.fiveSecondCallbackTriggered) {
      this.onFiveSecondMark(this.playlist[this.currentTrackIndex]);
      this.fiveSecondCallbackTriggered = true;
    }

    if (this.audioPlayer.duration) {
      const progressBar = this.controlsContainer.querySelector('input[type="range"]');
      progressBar.value = (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100;
      this.timeElapsedDisplay.textContent = this.formatTime(this.audioPlayer.currentTime);
      this.trackLengthDisplay.textContent = this.formatTime(this.audioPlayer.duration);
    }
  });

  this.audioPlayer.addEventListener('play', () => {
    this.fiveSecondCallbackTriggered = false;
    this.playlistFinished = false;
    this.updatePlayButton();
  });

  this.audioPlayer.addEventListener('pause', () => {
    this.updatePlayButton();
  });
};

AudioPlayer.prototype.formatTime = function(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
};

AudioPlayer.prototype.updatePlayButton = function() {
  this.playButtonElement.innerHTML = this.audioPlayer.paused ? PLAY_SYMBOL : PAUSE_SYMBOL;
};

AudioPlayer.prototype.loadPlaylistUI = function() {
  this.trackListElement.innerHTML = '';

  this.playlist.forEach((track, index) => {
    const listItem = document.createElement('li');
    const prefix = this.getTrackPrefix(track, index);

    listItem.className = 'track-item';
    listItem.draggable = true;
    listItem.style.listStyle = 'none';
    listItem.style.padding = '10px';
    listItem.style.cursor = 'pointer';
    listItem.style.display = 'flex';
    listItem.style.alignItems = 'center';
    listItem.style.borderBottom = '1px solid #ccc';
    listItem.style.textAlign = 'left';
    
    if (prefix) {
      const prefixElement = document.createElement('span');
      prefixElement.style.marginRight = '8px';
      prefixElement.innerHTML = prefix;
      listItem.appendChild(prefixElement);
    }

    const dragHandle = document.createElement('span');
    dragHandle.innerHTML = DRAG_HANDLE;
    dragHandle.style.cursor = 'grab';
    dragHandle.style.opacity = '0.7';
    dragHandle.style.fontSize = '16px';

    const trackText = document.createElement('span');
    trackText.style.flexGrow = '1';
    trackText.textContent = `${index + 1}. ${track.title} - ${track.artist} (${track.duration})`;

    listItem.appendChild(trackText);
    listItem.appendChild(dragHandle);

    // Drag and drop event listeners
    listItem.addEventListener('dragstart', (e) => {
      this.draggedItem = listItem;
      this.draggedItemIndex = index;
      this.draggedItemIndex.style.pointer = 'grab';
      listItem.style.opacity = '0.2';
      e.dataTransfer.effectAllowed = 'move';
    });

    listItem.addEventListener('dragend', () => {
      this.draggedItem.style.opacity = '1';
      this.draggedItem = null;
      this.draggedItemIndex = null;
      this.draggedItemIndex.style.pointer = 'pointer';

      // Remove all drag-over effects
      const items = this.trackListElement.getElementsByClassName('track-item');
      Array.from(items).forEach(item => {
        item.style.borderTop = '';
        item.style.borderBottom = '1px solid #ccc';
      });
    });

    listItem.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      const boundingRect = listItem.getBoundingClientRect();
      const midpoint = boundingRect.top + boundingRect.height / 2;

      if (e.clientY < midpoint) {
        listItem.style.borderTop = '2px solid #007acc';
        listItem.style.borderBottom = '1px solid #ccc';
      } else {
        listItem.style.borderTop = '';
        listItem.style.borderBottom = '2px solid #007acc';
      }
    });

    listItem.addEventListener('dragleave', () => {
      listItem.style.borderTop = '';
      listItem.style.borderBottom = '1px solid #ccc';
    });

    listItem.addEventListener('drop', (e) => {
      e.preventDefault();
      if (this.draggedItem === listItem) return;

      const boundingRect = listItem.getBoundingClientRect();
      const midpoint = boundingRect.top + boundingRect.height / 2;
      let newIndex = index;

      if (e.clientY > midpoint) {
        newIndex++;
      }

      // Update playlist array
      const [movedTrack] = this.playlist.splice(this.draggedItemIndex, 1);
      this.playlist.splice(newIndex, 0, movedTrack);

      // Update currentTrackIndex if needed
      if (this.currentTrackIndex === this.draggedItemIndex) {
        this.currentTrackIndex = newIndex;
      } else if (this.draggedItemIndex < this.currentTrackIndex && newIndex >= this.currentTrackIndex) {
        this.currentTrackIndex--;
      } else if (this.draggedItemIndex > this.currentTrackIndex && newIndex <= this.currentTrackIndex) {
        this.currentTrackIndex++;
      }

      // Reload playlist UI
      this.loadPlaylistUI();

      // Update active track styling
      Array.from(this.trackListElement.children).forEach((item, idx) => {
        item.classList.toggle('active', idx === this.currentTrackIndex);
      });
    });

    trackText.addEventListener('click', () => {
      // Reset playlist finished state when manually selecting a track
      this.playlistFinished = false;
      
      // Modified: Check if we're clicking on the current track
      if (index === this.currentTrackIndex) {
        // If it's the same track, toggle play/pause instead of reloading
        if (this.audioPlayer.paused) {
          this.audioPlayer.play();
        } else {
          this.audioPlayer.pause();
        }
      } else {
        // Different track, load and play it from the beginning
        this.loadAndPlayTrack(index);
      }
    });

    this.trackListElement.appendChild(listItem);
  });
  Array.from(this.trackListElement.children).forEach((item, idx) => {
    item.classList.toggle('active', idx === this.currentTrackIndex);
  });
};

AudioPlayer.prototype.loadAndPlayTrack = function(index) {
  try {
    if (this.playlist.length == 0) {
      return;
    }
    if (index < 0 || index >= this.playlist.length) {
      throw new Error('Invalid track index');
    }

    if (this.currentTrackIndex !== index || this.audioPlayer.paused) {
      this.audioPlayer.src = this.playlist[index].url;
      this.currentTrackIndex = index;
      this.onTrackStart(this.playlist[index]);
      if (this.shuffle && !this.shuffleHistory.includes(index)) {
        this.shuffleHistory.push(index);
      }
    }

    this.audioPlayer.play();
    this.playlistFinished = false;

    Array.from(this.trackListElement.children).forEach((item, idx) => {
      item.classList.toggle('active', idx === index);
    });

    this.updatePlayButton();
  } catch (error) {
    console.error('Error loading track:', error);
  }
};

AudioPlayer.prototype.playNextTrack = function() {
  const nextIndex = (this.currentTrackIndex + 1) % this.playlist.length;
  this.loadAndPlayTrack(nextIndex);
};

AudioPlayer.prototype.playPrevTrack = function() {
  const nextIndex = (this.currentTrackIndex - 1) % this.playlist.length;
  this.loadAndPlayTrack(nextIndex);
};

AudioPlayer.prototype.addTrack = function(track) {
  if (!track || !track.title || !track.url) {
    throw new Error('Invalid track object. Must contain at least title and url properties');
  }
  this.playlist.push(track);
  this.loadPlaylistUI();
  return this.playlist.length - 1; // Return index of newly added track
};

AudioPlayer.prototype.addTracks = function(tracks, playNext=false) {
  if (!Array.isArray(tracks)) {
    throw new Error('Tracks must be provided as an array');
  }
  
  const invalidTracks = tracks.filter(track => !track || !track.title || !track.url);
  if (invalidTracks.length > 0) {
    throw new Error('One or more tracks are invalid. Each track must contain at least title and url properties');
  }
  
  const startIndex = this.playlist.length;
  if (playNext) {
    this.playlist.splice(this.currentTrackIndex+1, 0, ...tracks);
  } else {
    this.playlist.push(...tracks);
  }
  this.loadPlaylistUI();
  return { startIndex, count: tracks.length };
};

AudioPlayer.prototype.clearPlaylist = function() {
  this.playlist = [];
  this.currentTrackIndex = 0;
  this.shuffleHistory = [];
  this.playlistFinished = false;
  this.loadPlaylistUI();
  this.audioPlayer.pause();
  this.updatePlayButton();
  this.timeElapsedDisplay.textContent = '0:00';
  this.trackLengthDisplay.textContent = '0:00';
  this.audioPlayer.src = '';
};

// For browser environments
if (typeof window !== 'undefined') {
  window.AudioPlayer = AudioPlayer;
}

// For module environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AudioPlayer,
    PLAY_SYMBOL,
    PAUSE_SYMBOL,
    PREV_SYMBOL,
    NEXT_SYMBOL,
    SHUFFLE_SYMBOL
  };
}
