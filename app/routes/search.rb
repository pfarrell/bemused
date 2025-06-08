require 'json'

class Bemused < Sinatra::Application

  def search_all_resources(query)
    db = Sequel::Model::db

    sql = <<-SQL
      (select model_type, id, similarity_score from (
        SELECT 'Album' as model_type,
        a.id,
        similarity(f_unaccent(lower(a.title)), ?) as similarity_score,
        ROW_NUMBER() OVER(PARTITION BY a.id ORDER BY similarity(f_unaccent(lower(a.title)), ?) DESC) as rn
      from albums a
        INNER JOIN tracks t on t.album_id = a.id
        where similarity(f_unaccent(lower(a.title)), ?) > 0.22
        ) ranked where rn = 1 order by similarity_score desc)
      UNION ALL
        (SELECT model_type, id, similarity_score from (
         select 'Artist' as model_type,
          a.id,
          similarity(f_unaccent(lower(a.name)), ?) as similarity_score,
          ROW_NUMBER() OVER(PARTITION BY a.id ORDER BY similarity(f_unaccent(lower(a.name)), ?) DESC) as rn
          from artists a
          INNER JOIN albums al on al.artist_id = a.id
          where similarity(f_unaccent(lower(a.name)), ?) > 0.22
          )ranked where rn = 1 order by similarity_score desc)
      UNION ALL
        SELECT 'Playlist' as model_type, id, -1.0 from playlists where f_unaccent(lower(name)) ILIKE ?
      UNION ALL
        SELECT 'Track' as model_type, id, -1.0 from tracks where f_unaccent(lower(title)) ILIKE ?
    SQL

    qp = "#{query}"
    lp = "%#{query}%"

    results = db.fetch(sql, qp, qp, qp, qp, qp, qp, lp, lp)

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
    return objects, grouped_ids
  end

  %w(get post).each do |meth|
    send meth, "/search" do
      query = params[:q]
      results, order = search_all_resources(query)
      albums = []
      artists = []
      if order['Album'] then
        album_ids = order['Album']
        album_id_to_idx = album_ids.each_with_index.to_h
        albums = results[:album].sort_by{|obj| album_id_to_idx[obj.id]}
      end
      if order['Artist'] then
        artist_ids = order['Artist']
        artist_id_to_idx = artist_ids.each_with_index.to_h
        artists = results[:artist].sort_by{|obj| artist_id_to_idx[obj.id]}
      end
      haml :search, layout: !request.xhr?, locals: {
        :albums => albums || [],
        :artists => artists || [],
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
