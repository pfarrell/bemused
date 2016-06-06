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

  after do
    Log.all.select{|log| Track[log.track_id].nil?}.each{|log| log.destroy}
  end

  context '#stats' do
    it 'has a stats class method' do
      #byebug if Log.count > 0
      expect(Log.stats).to_not be_nil
    end
  end
end
