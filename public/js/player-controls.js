function enqueueTracks(tracks, playNext = false, clearPlaylist = false) {
  if(clearPlaylist) {
    player.clearPlaylist();
  }
  
  player.addTracks(tracks, playNext);
  if(player.audioPlayer.paused) {
    player.loadAndPlayTrack(0);
  }
}

function enqueueTrack(track) {
  const idx = player.addTrack(track);
  if(player.audioPlayer.paused) {
    player.loadAndPlayTrack(idx);
  }
}

function playNext(tracks) {
  const info = player.addTracks(tracks, true);
  if(player.audioPlayer.paused) {
    player.loadAndPlayTrack(info.startIndex);
  }
}

