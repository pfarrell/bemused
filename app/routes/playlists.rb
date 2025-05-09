class Bemused < Sinatra::Application
  get "/playlist/:id" do
    haml :playlist, layout: !request.xhr?, locals: {playlist: Playlist[params[:id]]}
  end

  get "/playlists" do
    haml :playlists, layout: !request.xhr?, locals: {playlists: Playlist.where(auto_generated: nil).all}
  end

  get "/top" do
    playlist = Playlist.new
    playlist.name= "Top 20"
    Log.group_and_count(:track_id).filter('created_at > ?', Date.today - 7).order(Sequel.desc(:count)).limit(20).map do |x|
      track = Track[x.track_id]
      next if track.nil?
      playlist.playlist_tracks << PlaylistTrack.new(track: track)
    end
    playlist.image_path = playlist.random_image
    haml :playlist, layout: !request.xhr?, locals: {playlist: playlist}
  end

  get "/active" do
    playlist = Playlist.new
    playlist.name= "Random Active Tracks"
    playlist.playlist_tracks << PlaylistTrack.new(track: Track.active[0])
    playlist.image_path = playlist.random_image
    haml :radio, layout: !request.xhr?, locals: {playlist: playlist}
  end

  get "/newborns" do
    size = params[:size] || "25"
    haml :playlist, layout: !request.xhr?, locals: {playlist: Playlist.recent(size.to_i)}
  end

  post "/playlists/new" do
    playlist = Playlist.new(name: params["name"]).save
    redirect url_for("/admin/playlist/#{playlist.id}")
  end

  delete "/playlist_track/:id" do
    playlist_track = PlaylistTrack[params[:id]]
    playlist_track.destroy
  end

  post "/playlist_track/:id" do
    playlist_track = PlaylistTrack[params[:id]].merge_params(params)
    playlist_track.save
    respond_to do |wants|
      wants.js { playlist_track.to_json }
    end
  end

  get "/admin/playlist/:id" do
    haml :"admin/playlist", layout: !request.xhr?, locals: {model: Playlist[params[:id]]}
  end

  post "/admin/playlist/:id" do
    playlist = Playlist[params[:id]]
    playlist.name = params[:name]
    unless params[:track_name].nil? || params[:track_name] == ""
      pt = PlaylistTrack.new(track: Track.first(title: params[:track_name]))
      playlist.add_playlist_track(pt)
    end
    playlist.save
    haml :"admin/playlist", layout: !request.xhr?, locals: {model: playlist}
  end

  post "/admin/playlist/:id/image" do
    playlist = Playlist[params[:id]]
    open("#{params[:image_url]}") {|f|
      File.open("public/images/albums/#{params[:image_name]}", "wb") do |file|
        file.puts f.read
      end
    }
    playlist.image_path="#{params[:image_name]}"
    playlist.save
    redirect(url_for("/admin/playlist/#{playlist.id}"))
  end
end
