class Bemused < Sinatra::Application
  get "/playlist/:id" do
    haml :playlist, locals: {playlist: Playlist[params[:id]]} 
  end

  get "/playlists" do
    haml :playlists, locals: {playlists: Playlist.all}
  end

  post "/playlists/new" do
    playlist = Playlist.new(name: params["name"]).save
    redirect url_for("/admin/playlist/#{playlist.id}")
  end

  get "/admin/playlist/:id" do
    haml :"admin/playlist", locals: {model: Playlist[params[:id]]}
  end

  post "/admin/playlist/:id" do
    playlist = Playlist[params[:id]]
    playlist.name = params[:name]
    playlist.add_track(Track.first(title: [params[:track_name]])) unless params[:track_name].nil?
    playlist.save
    haml :"admin/playlist", locals: {model: playlist}
  end

  post "/admin/playlist/:id/image" do
    playlist = Playlist[params[:id]]
    open("#{params[:image_url]}") {|f|
      File.open("public/images/#{params[:image_name]}", "wb") do |file|
        file.puts f.read
      end
    }
    playlist.image_path="#{params[:image_name]}"
    playlist.save
    redirect(url_for("/admin/playlist/#{playlist.id}"))
  end
end
