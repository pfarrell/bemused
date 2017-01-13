require 'spec_helper'

describe Favorite do
  let(:track) {
    t=Track.new(title: "test track").save
    a=Album.new(title: "test album", image_path: "nilsson.jpg").save
    r=Artist.new(name: "test artist", image_path:"nilsson.jpg").save
    t.album=a
    t.artist=r

    t.save
    t
  }

  let(:favorite) { FavoriteTrack.create(track: track) }


  it 'deletes favorites' do
    id = favorite.id
    delete "/favorite/#{favorite.id}"
    expect(FavoriteTrack[id]).to be_nil
  end

end
