require 'spec_helper'

def artist
  Artist.find_or_create(name: "test_generated_artist")
end

describe Artist do
  subject(:artist) { Artist.find_or_create(name: "test_generated_artist") }
  let(:klass) { described_class.to_s.downcase }

  context do

    it_behaves_like "a search route", "/searchartists"
    it_behaves_like "a gettable route", "/artists/words"

    it_behaves_like "a gettable json route", "/artists.json?q=t"
    it_behaves_like "a gettable json route", "/artists/words.json"
  end

  it "gets artist by id" do
    get "/artist/#{artist.id}"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/Bemused/)
  end

  it "administrates artists by id" do
    get "/admin/artist/#{artist.id}"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/Bemused/)
  end
  it "updates via POST" do
    post "/admin/#{klass}/#{subject.id}",
    {
      name: "updated"
    }
    expect(last_response).to be_ok
    expect(last_response.body).to match(/Bemused/)
    ar=described_class[subject.id]
    expect(ar.name).to eq("updated")
  end

  it "saves images from urls for artists" do
    post "/admin/artist/#{artist.id}/image", {image_url: "./spec/fixtures/tumblin_dice.jpg", image_name: "tumblin_dice.jpg"}
    expect(Artist[artist.id].image_path).to eq("tumblin_dice.jpg")
    expect(last_response).to be_redirect
  end

end
