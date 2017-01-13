require 'spec_helper'

describe Playlist do
  let(:track) {
    t=Track.new(title: "test track").save
    a=Album.new(title: "test album", image_path: "nilsson.jpg").save
    r=Artist.new(name: "test artist", image_path:"nilsson.jpg").save
    t.album=a
    t.artist=r

    t.save
    t
  }

  let(:playlist) { Playlist.new(name: 'test_playlist').save }
  let(:playlist_track) { PlaylistTrack.new(track: track, playlist: playlist).save }


  let(:log) {
    get "/log/#{track.id}"
  }

  it 'creates top playlists' do
    log
    get "/top"
    expect(last_response).to be_ok
    expect(last_response).to match(/Bemused/)
  end

  it 'creates playlists of active tracks' do
    log
    get "/active"
    expect(last_response).to be_ok
    expect(last_response).to match(/Bemused/)
  end

  it 'creates playlists of favorite tracks' do
    get "/favorites"
    expect(last_response).to be_ok
    expect(last_response).to match(/Bemused/)
  end

  it 'manages playlist tracks' do
    post "/playlist_track/#{playlist_track.id}", {order: 3}
    expect(PlaylistTrack[playlist_track.id].order).to eq(3)
  end

  it 'deletes playlist tracks' do
    expect(Playlist[playlist.id].playlist_tracks.size).to eq(0)
    playlist_track
    expect(Playlist[playlist.id].playlist_tracks.size).to eq(1)
    delete "/playlist_track/#{playlist_track.id}"
    expect(Playlist[playlist.id].playlist_tracks.size).to eq(0)
  end
end

