require 'spec_helper'

describe 'Bemused' do
  let(:redis) {
    Redis.new
  }
  let(:playlist) {
    Playlist.find_or_create(name:"test_generated_playlist")
  }

  let(:artist) {
    Artist.find_or_create(name: "test_generated_artist")
  }

  let(:track) {
    track=Track.find_or_create(title: "test_generated_track")
    track.save
    track
  }

  let(:album) {
    album=Album.find_or_create(title: "test_generated_album")
    album.artist=artist
    album.tracks << track
    album.image_path='test_path/example.jpg'
    track.album = album
    track.save
    album.save
    album
  }

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

  it "has a playlist route" do
    get "/playlist/#{playlist.id}"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/Bemused/)
  end

  it "creates playlists" do
    post "/playlists/new", {name: "test_generated_playlist"}
    expect(last_response).to be_redirect
  end

  it "updates playlists" do
    post "/admin/playlist/#{playlist.id}", {name: "test_generated_playlist_update"}
    expect(last_response).to be_ok
    expect(last_response.body).to match(/Bemused/)
  end

  it "adds tracks to playlists" do
    post "/admin/playlist/#{playlist.id}",
      {
        name: "test_generated_playlist_updated",
        track_name: track.title
      }
    expect(last_response).to be_ok
    expect(last_response.body).to match(/Bemused/)
    expect(playlist.playlist_tracks.size).to eq(1)
  end

  it "updates artists" do
    post "/admin/artist/#{artist.id}",
    {
      name: "artist_name_updated"
    }
    expect(last_response).to be_ok
    expect(last_response.body).to match(/Bemused/)
    ar=Artist[artist.id]
    expect(ar.name).to eq("artist_name_updated")
  end

  it "has a logs route" do
    get "/logs"
    expect(last_response).to be_redirect
    follow_redirect!
    expect(last_response.body).to match(/Bemused/)
  end

  it "has a log route" do
    get "/log/#{Track.first.id}"
    expect(last_response.body).to be_empty
  end

  it "has a top route" do
    track = album.tracks.first
    get "/log/#{track.id}"
    get "/top"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/Bemused/)
  end

  it "has an active route" do
    track = album.tracks.first
    get "/log/#{track.id}"
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

  it "has live searchalbums route" do
    get "/searchalbums"
    expect(last_response).to be_ok
  end

  it "has live searchartists route" do
    get "/searchartists"
    expect(last_response).to be_ok
  end

  it "handles bad routes gracefully" do
    get "/foo"
    expect(last_response.status).to eq(404) 
    expect(last_response.body).to match(/Bemused/)
  end

  it "has a searchtracks route" do
    get "/searchtracks?q=w"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/suggestions/)
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

  it "has a tracks admin route" do
    get "/admin/track/#{track.id}"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/Bemused/)
  end           

  it "has a tracks route with a search" do
    get "/tracks?q=the"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/Bemused/)
  end           

  it "streams music" do
    get "/stream/65"
    expect(last_response).to be_ok
  end           

  it "has a search route" do
    Album.new(title: "wax lips").save
    Album.new(title: "waxing moon").save
    get "/search?q=wax"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/Bemused/)
  end           

  it "has a search route" do
    Album.new(title: "slartibartfast").save
    get "/search?q=bartfas"
    expect(last_response).to be_redirect
  end           

  it "has a search route" do
    Artist.new(name: "jj mclure").save
    get "/search?q=mclure"
    expect(last_response).to be_redirect
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

  it "updates albums" do
    post "/admin/album/#{album.id}"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/Bemused/)
  end

  it "has a recent albums route" do
    get "/albums/recent/1"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/Bemused/)
  end

  it "has a words route for albums" do
    get "/albums/words"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/Bemused/)
  end

  it "has a words.json route for albums" do
    get "/albums/words.json"
    expect(last_response).to be_ok
  end

  it "has a words route for artists" do
    get "/artists/words"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/Bemused/)
  end

  it "has a words.json route for artists" do
    get "/artists/words.json"
    expect(last_response).to be_ok
  end

  it "has an artists json route" do
    get "/artists.json?q=wax"
    expect(last_response).to be_ok
  end

  it "has an artist route" do
    get "/artist/#{artist.id}"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/Bemused/)
  end

  it "has an artist admin route" do
    get "/admin/artist/#{artist.id}"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/Bemused/)
  end

  it "has an album route" do
    get "/album/#{album.id}"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/Bemused/)
  end

  it "has an album admin route" do
    get "/admin/album/#{album.id}"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/Bemused/)
  end

  it "has a words route for tracks" do
    get "/tracks/words"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/Bemused/)
  end

  it "has a words.json route for tracks" do
    get "/tracks/words.json"
    expect(last_response).to be_ok
  end

  it "has ability to get more metadata about tracks" do
    get "/track_paths/test"
    expect(last_response).to be_ok
  end

  it "lets you update track metadata" do 
    post "/admin/track/#{track.id}", {title: "new test title"}
    new_track = Track[track.id]
    expect(new_track.title).to eq("new test title")
  end

  it "saves images from urls for albums" do
    post "/admin/album/#{album.id}/image", {image_url: "./spec/fixtures/tumblin_dice.jpg", image_name: "tumblin_dice.jpg"}
    expect(Album[album.id].image_path).to eq("tumblin_dice.jpg")
    expect(last_response).to be_redirect
  end

  it "saves images from urls for artists" do
    post "/admin/artist/#{artist.id}/image", {image_url: "./spec/fixtures/tumblin_dice.jpg", image_name: "tumblin_dice.jpg"}
    expect(Artist[artist.id].image_path).to eq("tumblin_dice.jpg")
    expect(last_response).to be_redirect
  end

  it "saves images from urls for playlists" do
    post "/admin/playlist/#{playlist.id}/image", {image_url: "./spec/fixtures/tumblin_dice.jpg", image_name: "tumblin_dice.jpg"}
    expect(Playlist[playlist.id].image_path).to eq("tumblin_dice.jpg")
    expect(last_response).to be_redirect
  end
  
  it "uploads files" do
    test_key = "testbemused:incoming"
    last=redis.llen(test_key).to_i
    post "/upload", {key: test_key, images: [Rack::Test::UploadedFile.new("./spec/fixtures/tumblin_dice.jpg", "image/jpg")]}
    expect(redis.llen(test_key).to_i).to eq(last + 1)
    expect(last_response).to be_redirect
  end
end
