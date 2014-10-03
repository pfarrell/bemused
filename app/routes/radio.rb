class Bemused < Sinatra::Application
  get "/radio" do
    haml :radio, locals: {playlist: Playlist.single("Radio, Radio")}
  end
end 
