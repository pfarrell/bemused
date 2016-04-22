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

  let(:log) {
    get "/log/#{track.id}"
  }

  it "return an artist's image when album image is unset" do
    expect(track.image).to eq("artists/nilsson.jpg")
  end

  it "finds active tracks" do
    log
    expect(Track.active(1)).to_not be_nil
  end
end


