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
end

