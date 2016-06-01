require 'spec_helper'

describe Info do
  let(:artist) {Artist.new(name:"test_name")}
  let(:album) { Album.new(title:"test_title") }
  let(:track) { Track.new(title:"test_track_title_5") }

  before do
    artist.save
    album.artist = artist
    album.save
    track.artist = artist
    track.album = album
    track.save
    get "/log/#{track.id}"
  end

  context '#meta' do

    it 'returns album information' do
      get '/meta?q=te'
      expect(last_response).to be_ok
      expect(last_response).to match(/test_name/)
      expect(last_response).to match(/test_track_title/)
      expect(last_response).to match(/test_title/)
    end

    it 'requires 2 characters to search' do
      get '/meta?q=t'
      expect(last_response).to be_ok
      expect(last_response).to_not match(/test_name/)
      expect(last_response).to_not match(/test_track_title/)
      expect(last_response).to_not match(/test_title/)
    end

    it 'works without a q param' do
      get '/meta'
      expect(last_response).to be_ok
    end

    context '/stats' do
      shared_examples "a stats json route" do |path, type|
        before do
          get path
        end



        it 'returns ok' do
          byebug if Log.count > 1
          expect(last_response).to be_ok
        end

        it 'includes type' do
          json = JSON.parse(last_response.body)
          expect(json['type']).to eq(type)
        end

        it 'includes props' do
          json = JSON.parse(last_response.body)
          expect(json['props']).to be_a Hash
        end

        it "has json header" do
          expect(last_response.headers["Content-Type"]).to eq("application/json")
        end
      end

      it 'has a stats page' do
        get '/stats'
        expect(last_response).to be_ok
      end

      it_behaves_like 'a stats json route', '/stats/artists', 'Artist'
      it_behaves_like 'a stats json route', '/stats/albums', 'Album'
      it_behaves_like 'a stats json route', '/stats/tracks', 'Track'
      it_behaves_like 'a stats json route', '/stats/logs', 'Log'

    end
  end
end
