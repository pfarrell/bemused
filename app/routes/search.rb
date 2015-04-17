require 'json'
class Bemused < Sinatra::Application
  get "/search" do
    query = params[:q]
    redirect(url_for("/#{query[1..-1]}")) if query =~ /^\//
    redirect(url_for("/")) if query.nil? || query.length < 2
    haml :search, locals: {
      :albums => Album.where(Sequel.ilike(:title, "%#{query}%")),
      :artists => Artist.where(Sequel.ilike(:name, "%#{query}%"))
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

  get "/rand" do
    haml :album, locals: {album: Album.order{rand{}}.first}
  end

  get "/surprise" do
    haml :playlist, locals: {playlist: Playlist.surprise(10)}
  end

  get "/track_paths/:search" do
    content_type :json
    MediaFile.where(Sequel.ilike(:absolute_path, "%#{params[:search]}%")).to_json
  end

end
