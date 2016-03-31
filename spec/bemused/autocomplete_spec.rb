require 'spec_helper'

describe AutoComplete do
  let(:artist) {
    Artist.find_or_create(name: "test_generated_artist")
  }

  let(:track) {
    track=Track.find_or_create(title: "test_generated_track")
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

  it 'returns albums' do
    album
    expect(AutoComplete.lookup('t')['suggestions'].select{|x| x == {'value'=> 'test_generated_album'}}.size).to eq(1)
  end

end

