require 'spec_helper'

describe 'App' do
  it "should allow access to the home page" do
    get "/"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/Bemused/)
  end

  it "has a radio route" do
    get "/radio"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/Bemused/)
  end

  it "has an upload route" do
    get "/upload"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/Bemused/)
  end

  it "has a playlists route" do
    get "/playlists"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/Bemused/)
  end

  it "has an artists route" do
    get "/artists"
    #expect(last_response).to be_ok
    expect(last_response.body).to match(/Bemused/)
  end

  it "has a logs route" do
    get "/log"
    #expect(last_response).to be_ok
    expect(last_response.body).to match(/Bemused/)
  end

end
