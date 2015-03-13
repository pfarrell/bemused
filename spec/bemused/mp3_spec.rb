require 'spec_helper'

describe Mp3 do
  let(:file) { "./spec/fixtures/test.mp3" }
  let(:mp3) {Mp3.new(file)}
  
  it "intialized with a file" do
    expect(mp3.file_path).to eq(file)
  end

  it "imports tags" do
    expect(mp3.import).to_not be_nil
  end

  it "has tags" do
    expect(mp3.tags).to_not be_nil
  end
end
