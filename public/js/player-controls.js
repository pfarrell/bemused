function enqueueAlbum(tracks, playNext = false, clearPlaylist = false) {
  if(clearPlaylist) {
    player.clearPlaylist();
  }
  
  player.addTracks(tracks, playNext);
  if(player.audioPlayer.paused) {
    player.loadAndPlayTrack(0);
  }
}

function enqueueTrack(track) {
  player.addTrack(track)
}

