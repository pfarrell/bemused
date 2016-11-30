require 'json'
class Bemused < Sinatra::Application

  def search
  end

  def search_albums
  end

  def handle_direct
    url_for("/#{params[:lookup_type]}/#{params[:lookup_id].to_i}")
  end

  %w(get post).each do |meth|
    send meth, "/search" do
      query = params[:q]
      redirect(url_for("/#{AutoComplete.translate(query[1..-1])}")) if query =~ /^\//
      redirect(url_for("/")) if query.nil? || query.length < 2
      redirect handle_direct unless params[:lookup_type].nil? || params[:lookup_type].empty?
      albums = Album.where(Sequel.ilike(:title, "%#{query}%"))
      artists = Artist.where(Sequel.ilike(:name, "%#{query}%"))
      playlists = Playlist.where(Sequel.ilike(:name, "%#{query}%"))
      redirect(url_for("/artist/#{artists.first.id}")) if artists.count == 1 and albums.count == 0
      redirect(url_for("/album/#{albums.first.id}")) if albums.count == 1 and artists.count == 0
      haml :search, locals: {
        :albums => albums,
        :artists => artists,
        :playlists => playlists
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
