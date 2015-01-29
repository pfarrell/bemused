require 'spec_helper'

describe 'Bemused' do
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

  it "has a logs route" do
    get "/logs"
    expect(last_response).to be_redirect
    follow_redirect!
    puts last_request.url
    expect(last_response.body).to match(/Bemused/)
  end

  it "has a top route" do
    get "/top"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/Bemused/)
  end

  it "has an active route" do
    get "/active"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/Bemused/)
  end

  it "has an newborns route" do
    get "/newborns"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/Bemused/)
  end

  it "has a rand route" do
    get "/rand"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/Bemused/)
  end           

  it "has a surprise route" do
    get "/surprise"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/Bemused/)
  end           

  it "has a livesearch route" do
    get "/livesearch?q=w"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/suggestions/)
  end           

  it "has a searchtracks route" do
    get "/searchtracks?q=w"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/suggestions/)
  end           

  it "has a track route" do
    get "/search?q=wax"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/Bemused/)
  end           

  it "has a random track route" do
    get "/track/random"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/^\[\{.*\}\]$/)
  end           

  it "has a tracks route" do
    get "/tracks"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/Bemused/)
  end           

  it "has a tracks route with a search" do
    get "/tracks?q=the"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/Bemused/)
  end           

  it "streams music" do
    get "/stream/1"
    expect(last_response).to be_ok
  end           

  it "has a search route" do
    get "/search?q=wax"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/Bemused/)
  end           

  it "redirects for searches with / as first character" do
    get "/search?q=/test"
    expect(last_response).to be_redirect
  end

  it "has a playlist admin route" do
    get "/admin/playlist/1"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/Bemused/)
  end           

  it "has a recent albums route" do
    get "/albums/recent"
    expect(last_response).to be_redirect
  end

  it "has a recent albums route" do
    get "/albums/recent/1"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/Bemused/)
  end
end
