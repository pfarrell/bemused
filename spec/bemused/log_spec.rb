require 'spec_helper'

describe Log do

  let(:artist) {Artist.new(name:"test_name")}
  let(:album) { Album.new(title:"test_title") }
  let(:track) { Track.new(title:"test_track_title") }

  before do
    artist.save
    album.artist = artist
    album.save
    track.artist = artist
    track.album = album
    track.save
    get "/log/#{track.id}"
  end

  context '#stats' do
    it 'has a stats class method' do
      expect(Log.stats).to_not be_nil
    end
  end
end
