require 'spec_helper'

describe Info do
  let(:artist) {Artist.new(name:"test_name")}
  let(:album) {Album.new(title:"test_title")}
  let(:track) {Track.new(title:"test_track_title")}

  before do
    artist.save
    album.save
    track.save
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
  end
end
