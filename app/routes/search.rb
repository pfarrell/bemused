require 'json'
class Bemused < Sinatra::Application

  %w(get post).each do |meth|
    send meth, "/search" do
      query = params[:q]
      albums = albums_with_tracks(query)
      artists = artists_with_albums(query)
      playlists = Playlist.where(Sequel.ilike(:name, "%#{query}%"))
      tracks = tracks_from_search(query)
      haml :search, layout: !request.xhr?, locals: {
        :albums => albums,
        :artists => artists,
        :playlists => playlists,
        :tracks => tracks[:tracks],
        :count => tracks[:count]
      }
    end
  end

  get "/livesearch" do
    content_type :json
    AutoComplete.lookup(params["q"]).to_json
  end

  get "/searchtracks" do
    content_type :json
    AutoComplete.tracks(params["q"]).to_json
  end

  get "/searchalbums" do
    content_type :json
    AutoComplete.albums(params["q"]).to_json
  end

  get "/searchartists" do
    content_type :json
    AutoComplete.artists(params["q"]).to_json
  end

  get '/searchtags' do
    content_type :json
    AutoComplete.tags(params["q"]).to_json
  end

  get "/random" do
    haml :album, layout: !request.xhr?, locals: {album: Album.order{Sequel.lit('RANDOM()')}.first}
  end

  get "/surprise" do
    playlist = Playlist.surprise(size: 20, persist: true)
    redirect( url_for("/surprise/#{playlist.id}") )
  end

  get "/surprise/:id" do
    haml :playlist, layout: !request.xhr?, locals: {playlist: Playlist.surprise(size: 20, persist: true)}
  end

  get "/track_paths/:search" do
    content_type :json
    Track.join(:media_files, :id =>:media_file_id).where(Sequel.ilike(:title, "%#{params[:search]}%")).to_json
  end

end
