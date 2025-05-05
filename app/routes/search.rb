require 'json'

class Bemused < Sinatra::Application

  def search_all_resources(query)
    db = Sequel::Model::db

    sql = <<-SQL
      SELECT 'Album' as model_type, id from albums where f_unaccent(lower(title)) ILIKE ?
      UNION ALL
      SELECT 'Artist' as model_type, id from artists where f_unaccent(lower(name)) ILIKE ?
      UNION ALL
      SELECT 'Playlist' as model_type, id from playlists where f_unaccent(lower(name)) ILIKE ?
      UNION ALL
      SELECT 'Track' as model_type, id from tracks where f_unaccent(lower(title)) ILIKE ?
    SQL

    query_pattern = "%#{query}%"

    results = db.fetch(sql, query_pattern, query_pattern, query_pattern, query_pattern)

    grouped_ids = results.each_with_object({}) do |result,hash|
      model_type = result[:model_type]
      id = result[:id]
      hash[model_type] ||= []
      hash[model_type] << id
    end

    objects = {}
    grouped_ids.each do |model_type, ids|
      next if ids.empty?
      model_class = Object.const_get(model_type)
      model_objects = model_class.where(id: ids).all
      objects[model_type.downcase.to_sym] = model_objects
    end
    objects
  end

  %w(get post).each do |meth|
    send meth, "/search" do
      query = params[:q]
      results = search_all_resources(query)

      haml :search, layout: !request.xhr?, locals: {
        :albums => results[:album] || [],
        :artists => results[:artist] || [],
        :playlists => results[:playlist] || [],
        :tracks => results[:track] || [],
        :count => 0
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
