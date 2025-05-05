require 'json'
require 'async'
require 'async/http'

class Bemused < Sinatra::Application
  # Async search function
  def search_all_resources(query)
    result = {}

    Async do

      albums_task = Async do
        result[:albums] = albums_with_tracks(query)
      end
      artists_task = Async do
        result[:artists] = artists_with_albums(query)
      end

      playlists_task = Async do
        result[:playlists] = Playlist.where(Sequel.ilike(:name, "%#{query}%"))
      end

      tracks_task = Async do
        result[:tracks] = tracks_from_search(query)
      end

      # Wait for all tasks to complete
      [albums_task, artists_task, playlists_task, tracks_task].each(&:wait)
    end.wait

    return result
  end

  %w(get post).each do |meth|
    send meth, "/search" do
      query = params[:q]
      results = search_all_resources(query)

      haml :search, layout: !request.xhr?, locals: {
        :albums => results[:albums],
        :artists => results[:artists],
        :playlists => results[:playlists],
        :tracks => results[:tracks][:tracks],
        :count => results[:tracks][:count]
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
