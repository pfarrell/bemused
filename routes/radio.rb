class Bemused < Sinatra::Application
  get "/track/random" do
    Track.random.to_json
  end

  get "/radio" do
    haml :radio, locals: {playlist: Playlist.single("Radio, Radio")}
  end
end 
