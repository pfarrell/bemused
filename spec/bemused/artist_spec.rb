require 'spec_helper'

describe Artist do
  let(:artist) {
    Artist.find_or_create(name: "test_generated_artist")
  }
  
  it "to_s returns artist name" do
    expect(artist.to_s).to eq(artist.name)
  end
end
