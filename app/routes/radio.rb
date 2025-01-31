class Bemused < Sinatra::Application
  get "/radio" do
    haml :radio, layout: !request.xhr?, locals: {playlist: Playlist.single("Radio, Radio")}
  end
end
