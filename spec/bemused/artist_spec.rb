require 'spec_helper'

describe Artist do
  let(:artist) {Artist.first}
  
  it "to_s returns artist name" do
    expect(artist.to_s).to eq(artist.name)
  end
end
