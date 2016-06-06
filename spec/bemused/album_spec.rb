require 'spec_helper'

describe Album do
  let(:artist) {
    Artist.find_or_create(name: "test_generated_artist")
  }

  let(:track) {
    track=Track.find_or_create(title: "test_generated_track_1")
    track.save
    track
  }

  let(:album) {
    album=Album.find_or_create(title: "test_generated_album")
    album.artist=artist
    album.tracks << track
    album.image_path='test_path/example.jpg'
    track.album = album
    track.save
    album.save
    album
  }

  it "to_s returns album title" do
    expect(album.to_s).to eq(album.title)
  end

  context '#json' do
    it 'has a class method for stats' do
      expect(Album.stats).to_not be_nil
    end
  end
end
