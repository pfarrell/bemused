require 'json'
class Bemused < Sinatra::Application
  get "/search" do
    query = params[:q]
    redirect(url_for("/#{AutoComplete.translate(query[1..-1])}")) if query =~ /^\//
    redirect(url_for("/")) if query.nil? || query.length < 2
    albums = Album.where(Sequel.ilike(:title, "%#{query}%"))
    artists = Artist.where(Sequel.ilike(:name, "%#{query}%"))
    redirect(url_for("/artist/#{artists.first.id}")) if artists.count == 1 and albums.count == 0
    redirect(url_for("/album/#{albums.first.id}")) if albums.count == 1 and artists.count == 0
    haml :search, locals: {
      :albums => albums,
      :artists => artists
    }
  end

  get "/livesearch" do
    AutoComplete.lookup(params["q"]).to_json
  end

  get "/searchtracks" do
    AutoComplete.tracks(params["q"]).to_json
  end

  get "/searchalbums" do
    AutoComplete.albums(params["q"]).to_json
  end

  get "/searchartists" do
    AutoComplete.artists(params["q"]).to_json
  end

  get '/searchtags' do
    AutoComplete.tags(params["q"]).to_json
  end

  get "/random" do
    haml :album, locals: {album: Album.order{Sequel.lit('RANDOM()')}.first}
  end

  get "/surprise" do
    haml :playlist, locals: {playlist: Playlist.surprise(10)}
  end

  get "/track_paths/:search" do
    content_type :json
    Track.join(:media_files, :id =>:media_file_id).where(Sequel.ilike(:title, "%#{params[:search]}%")).to_json
  end

end
