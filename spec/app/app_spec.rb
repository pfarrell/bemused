require 'spec_helper'

shared_examples "a gettable route" do |path|
  before do
    get path
  end

  it "should allow access to #{path}" do
    expect(last_response).to be_ok
  end

  it "#{path} should have Bemused in the body" do
    expect(last_response.body).to match(/Bemused/)
  end
end

shared_examples 'a redirected route' do |path|
  before do
    get path
  end

  it "should redirect" do
    expect(last_response).to be_redirect
  end

  it "should redirect only once" do
    follow_redirect!
    expect(last_response.body).to match(/Bemused/)
  end
end

shared_examples "a gettable json route" do |path|
  before do
    get path
  end

  it "returns ok" do
    expect(last_response).to be_ok
  end

  it "has json header" do
    expect(last_response.headers["Content-Type"]).to eq("application/json")
  end
end

shared_examples "a taggable object" do

  it "allows tags to be added" do
    expect(obj.tags.size).to eq(0)
    put "/#{obj.class.to_s.downcase}/#{obj.id}/tags", {tag: "#{tag1.name}"}
    expect(last_response).to be_ok
    expect(obj.class[obj.id].tags.size).to eq(1)
  end

  it "allows tags to be removed" do
    expect(obj.tags.size).to eq(0)
    obj.add_tag(tag1)
    expect(obj.class[obj.id].tags.size).to eq(1)
    delete "/#{obj.class.to_s.downcase}/#{obj.id}/tag/#{tag1.id}"
    expect(obj.class[obj.id].tags.size).to eq(0)
  end
end

shared_examples 'a search route' do |path|
  it "returns data" do
    get path
    expect(last_response).to be_ok
    expect(last_response.body).to match(/suggestions/)
  end
end

describe 'Bemused' do
  let(:tag1) { Tag.find_or_create(name: "test_tag_1") }
  let(:tag2) { Tag.find_or_create(name: "test_tag_2") }
  let(:tag3) { Tag.find_or_create(name: "test_tag_3") }
  let(:redis) { Redis.new }
  let(:playlist) { Playlist.find_or_create(name:"test_generated_playlist") }
  let(:artist) { Artist.find_or_create(name: "test_generated_artist") }
  let(:media_file) { MediaFile.find_or_create(absolute_path: "./spec/fixtures/test.mp3") }
  let(:nothing_album) {Album.new(title: "return nothing", artist: artist).save}
  let(:track) {
    track=Track.find_or_create(title: "test_generated_track")
    track.media_file = media_file
    track.artist = artist
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

  context do
    before(:all) do
      track  =Track.find_or_create(title: "test_generated_track_4")
      album  =Album.find_or_create(title: "test_generated_album")
      artist =Artist.find_or_create(name: "test_generated_artist")
      album.add_track(track)
      album.artist = artist
      album.save
      get "log/#{track.id}"
    end

    after(:all) do
      Track.find(title: "test_generated_track_4").destroy
      Album.find(title: "test_generated_album").destroy
      Artist.find(name: "test_generated_artist").destroy
      Log.all.select{|log| Track[log.track_id].nil?}.each{|log| log.destroy}
    end

    it_behaves_like "a gettable route", "/"
    it_behaves_like "a gettable route", "/radio"
    it_behaves_like "a gettable route", "/upload"
    it_behaves_like "a gettable route", "/playlists"
    it_behaves_like "a gettable route", "/newborns"
    it_behaves_like "a gettable route", "/random"
    it_behaves_like "a gettable route", "/tracks"

    it_should_behave_like 'a redirected route', '/logs'
    it_should_behave_like 'a redirected route', '/resume'

    it_behaves_like "a search route", "/livesearch?q=t"
    it_behaves_like "a search route", "/searchalbums"
    it_behaves_like "a search route", "/searchtags"
    it_behaves_like "a search route", "/searchtags?q=test"
    it_behaves_like "a search route", "/searchartists"
    it_behaves_like "a search route", "/searchtracks"

  end

  context 'unauthenticated user' do

    let(:prod_login_url) { 'https://patf.net/moth/application/3/login' }

    it "prevents users from favoriting tracks" do
      post("/track/#{track.id}/favorite")
      expect(FavoriteTrack.where(track: track).count).to eq(0)
    end

    it "prevents users from unfavoriting tracks" do
      delete("/track/#{track.id}/favorite")
    end

    it 'has a login link' do
      curr_env = ENV['RACK_ENV']
      ENV['RACK_ENV'] = 'production'
      get('/')
      expect(last_response.body).to match(/#{prod_login_url}/)
      ENV['RACK_ENV'] = curr_env
    end
  end

  context 'authenticated user' do

    let(:token) { "eyJ1c2VyX2lkIjoiMzZmNDExOWZhYjk2IiwidG9rZW4iOiIzMmEzZjA1N2Y0MmMzMzFkZDE0NzQwNDFkYzhmMDMyMCIsInByb2ZpbGVfdXJsIjoiaHR0cDovL2xvY2FsaG9zdDo5MjkyL3VzZXIvMSIsImxvZ291dF91cmwiOiJodHRwOi8vbG9jYWxob3N0OjkyOTIvYXBwbGljYXRpb24vMy9sb2dvdXQiLCJuYW1lIjoiUGF0cmljayJ9" }
    let(:user) { User.new(token) }

    before do
      rack_mock_session.set_cookie "auth=#{token}"
      post("/track/#{track.id}/favorite")
    end

    it_should_behave_like 'a redirected route', '/resume'

    it "lets authenticated users favorite tracks" do
      expect(FavoriteTrack.where(track: track).count).to eq(1)
      expect(track.favorited?(user)).to eq(true)
    end

    it "prevents users from unfavoriting tracks" do
      delete("/track/#{track.id}/favorite")
      expect(FavoriteTrack.where(track: track).count).to eq(0)
    end

    it 'has a link for the user profile' do
      get('/')
      expect(last_response.body).to match(/#{user.name}/)
    end

    it 'gets favorites for albums' do
      get "/album/#{album.id}"
      expect(last_response.body).to match(/#{user.name}/)
    end

  end

  it "has a logs route" do
    30.times do
      get "/log/#{track.id}"
    end
    get "/logs/1"
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

  it "has a log route" do
    get "/log/#{Track.first.id}"
    expect(last_response.body).to be_empty
  end

  it "handles bad routes gracefully" do
    get "/foo"
    expect(last_response.status).to eq(404)
    expect(last_response.body).to match(/Bemused/)
  end

  it "has a random track route" do
    get "/track/random"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/^\[\{.*\}\]$/)
  end

  it "has a tracks admin route" do
    get "/admin/track/#{track.id}"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/Bemused/)
  end

  it "has a tracks route with a search" do
    track
    get "/tracks?q=tes"
    expect(last_response).to be_ok
    expect(last_response.body).to match(/Bemused/)
  end

  it "streams music" do
    get "/stream/#{track.id}"
    expect(last_response).to be_ok
  end

#  it "has a search route" do
#    Artist.new(name: "wax lips").save
#    Album.new(title: "waxing moon").save
#    get "/search?q=wax&lookup_type=artist"
#    expect(last_response).to be_redirect
#    expect(last_response.headers['Location']).to match(/artist\//)
#  end

  it "has a search route" do
    Artist.new(name: "wax lips").save
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
    get "/admin/playlist/#{playlist.id}"
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

  it "pages recent albums" do
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

  it "deletes tracks" do
    id = track.id
    delete "/admin/track/#{id}"
    expect(Track[id]).to be_nil
  end

  it "looks up album summaries on wikipedia" do
    get "/album/#{album.id}/summary"
    expect(last_response).to be_ok
  end

  it "looks up album summaries on wikipedia" do
    get "/artist/#{artist.id}/summary"
    expect(last_response).to be_ok
  end

  it "lookup up track summaries on wikipedia" do
    get "/track/#{track.id}/summary"
    expect(last_response).to be_ok
  end

  it "looks up summaries on wikipedia" do
    get "/summary/test/test"
    expect(last_response).to be_ok
  end

  it "handles execptions from underlying lookups" do
    get "/summary/test/raise"
    expect(last_response).to be_ok
  end

  it "handles empty responses from underlying lookups" do
    get "/summary/test/return+nothing"
    expect(last_response).to be_ok
  end

  it "handles redirects for paginated tags" do
    get "/admin/tags"
    expect(last_response).to be_redirect
  end

  it "has an admin page for all tags" do
    get "/admin/tags/1"
    expect(last_response).to be_ok
  end

  it "has an admin page for all tags in json" do
    get "/admin/tags/1.json"
    expect(last_response).to be_ok
  end

  it "allows users to control tags for their browser" do
    get "/tags"
    expect(last_response).to be_ok
  end

  it "allows tags to be created" do
    expect(Tag.where(name: "new_tag").count).to eq(0)
    post "/tags", {name: "new_tag"}
    tags = Tag.where(name: "new_tag")
    expect(tags.count).to eq 1
  end

  it "allows tags to be updated" do
    post "/admin/tag/#{tag1.id}", {name: "updated_tag"}
    t = Tag[tag1.id]
    expect(t.name).to eq ("updated_tag")
  end

  it "allows tags to be set on cookies" do
    post '/tags/set', {"tag_#{tag1.id}" => tag1.id}
    expect(rack_mock_session.cookie_jar["tags"]).to match(/#{tag1.id}/)
  end

  it_behaves_like "a taggable object" do
    let(:tag1) { Tag.find_or_create(name: "test_tag_1") }
    let(:obj) { Artist.find_or_create(name: "test_generated_artist") }
  end

  it_behaves_like "a taggable object" do
    let(:tag1) { Tag.find_or_create(name: "test_tag_1") }
    let(:obj) {Album.find_or_create(title: "test_generated_album") }
  end

  it 'handles wikipeda lookups that return nothing' do
    get "/album/#{nothing_album.id}/summary"
    expect(last_response).to be_ok
  end

  it 'updates album tracks wholesale' do
    patch "/admin/album/#{album.id}/tracks"
  end

end
