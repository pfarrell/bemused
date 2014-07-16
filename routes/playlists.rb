class Bemused < Sinatra::Application
  get "/playlist/:id" do
    haml :playlist, locals: {playlist: Playlist[params[:id]]} 
  end

  get "/admin/playlist/:id" do
    haml :"admin/playlist", locals: {model: Playlist[params[:id]]}
  end

  post "/admin/playlist/:id" do
    playlist = Playlist[params[:id]]
    playlist.name = params[:name]
    playlist.add_track(Track[params[:track_id]]) unless params[:track_id].nil?
    playlist.save
    haml :"admin/playlist", locals: {model: playlist}
  end
end
