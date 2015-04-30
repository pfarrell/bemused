require 'spec_helper'

describe Track do
  let(:track) {
    t=Track.new(title: "test track").save
    a=Album.new(title: "test album").save
    r=Artist.new(name: "test artist", image_path:"nilsson.jpg").save
    t.album=a
    t.artist=r

    t.save
  }
  it "return an artist's image when album image is unset" do
    expect(track.image).to eq("artists/nilsson.jpg")
  end
end


