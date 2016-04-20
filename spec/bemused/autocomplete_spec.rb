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

  shared_examples_for 'it autocompletes' do |search, command|
    describe "the #{command} command" do
      it "#{search} returns shortcut for #{command} command" do
        expect(AutoComplete.lookup("#{search}")['suggestions'].select{|x| x == {'value'=> "#{command}"}}.size).to eq(1)
      end
    end
  end

  it 'returns albums' do
    album
    expect(AutoComplete.lookup('t')['suggestions'].select{|x| x == {'value'=> 'test_generated_album'}}.size).to eq(1)
  end

  it 'returns artists' do
    album
    expect(AutoComplete.lookup('t')['suggestions'].select{|x| x == {'value'=> 'test_generated_artist'}}.size).to eq(1)
  end

  it 'ignores artists without albums' do
    expect(Artist[artist.id].name).to eq(artist.name)
    expect(AutoComplete.lookup('t')['suggestions'].select{|x| x == {'value'=> 'test_generated_artist'}}.size).to eq(0)
  end

  context do
    before(:all) do
      track  =Track.find_or_create(title: "test_generated_track")
      get "/log/#{track.id}"
    end

    after(:all) do
      Track.find(title: "test_generated_track").destroy
    end

    it_behaves_like 'it autocompletes', 'a', "/active"
    it_behaves_like 'it autocompletes', '/act', "/active"
    it_behaves_like 'it autocompletes', 'a', "/albums/recent"
    it_behaves_like 'it autocompletes', 'rec', "/albums/recent"
    it_behaves_like 'it autocompletes', 'a', "/albums/words"
    it_behaves_like 'it autocompletes', 'wor', "/albums/words"
    it_behaves_like 'it autocompletes', 'l', "/logs"
    it_behaves_like 'it autocompletes', 'log', "/logs"
    it_behaves_like 'it autocompletes', 'n', "/newborns"
    it_behaves_like 'it autocompletes', 'newb', "/newborns"
    it_behaves_like 'it autocompletes', 'p', "/playlists"
    it_behaves_like 'it autocompletes', '/pl', "/playlists"
    it_behaves_like 'it autocompletes', 'r', "/radio"
    it_behaves_like 'it autocompletes', 'radi', "/radio"
    it_behaves_like 'it autocompletes', 'r', "/random"
    it_behaves_like 'it autocompletes', '/random', "/random"
    it_behaves_like 'it autocompletes', 's', "/surprise"
    it_behaves_like 'it autocompletes', 'pri', "/surprise"
    it_behaves_like 'it autocompletes', 't', "/top"
    it_behaves_like 'it autocompletes', 'op', "/top"
    it_behaves_like 'it autocompletes', 't', "/tracks"
    it_behaves_like 'it autocompletes', 'acks', "/tracks"
    it_behaves_like 'it autocompletes', 't', "/tracks/words"
    it_behaves_like 'it autocompletes', 'WORDS', "/tracks/words"
    it_behaves_like 'it autocompletes', 't', "/track_paths"
    it_behaves_like 'it autocompletes', '_', "/track_paths"
    it_behaves_like 'it autocompletes', 'u', "/upload"
    it_behaves_like 'it autocompletes', 'UP', "/upload"
  end

end

