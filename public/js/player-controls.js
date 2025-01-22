function enqueueAlbum(tracks) {
  player.clearPlaylist();
  
  player.addTracks(tracks)
  player.loadAndPlayTrack(0);
}

function enqueueTrack(track) {
  player.addTrack(track)
}

