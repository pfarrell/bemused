require 'spec_helper'

describe Album do
  let(:album) {Album.first}
  
  it "to_s returns album title" do
    expect(album.to_s).to eq(album.title)
  end
end
