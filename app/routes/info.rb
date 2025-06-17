class Bemused < Sinatra::Application

  def possible_titles(artist, title)
    ["#{title} (#{artist} album)", "#{title} (album)", title]
  end

  def possible_names(name)
    ["#{name} (band)", "#{name} (singer)", name]
  end

  def possible_songs(artist, title)
    ["#{title} (#{artist} song)", "#{title} (song)", title]
  end

  def summary(category, searches)
    searches.each do |search|
      summary = lookup(category, search)
      return summary unless summary.nil?
    end
    return ''
  end

  def lookup(category, search)
    begin
      settings.info.summary(category, search)
    rescue Exception => ex
      nil
    end
  end

  def wp_fix(title)
    [['At', 'at'], ['The', 'the'], ['Of', 'of'], ['For', 'for'], ['To', 'to']].each do |arr|
      title = fix(title, arr[0], arr[1])
    end
    title
  end

  def fix(string, match, replace)
    string&.gsub(/\b#{match}\b/, replace)
  end

  def coalesce(str)
    (str.nil? || str.empty?) ? nil : str
  end

  get "/album/:id/summary" do
    album = Album[params[:id]]
    artist = album.artist.name
    title = coalesce(album.wikipedia) || wp_fix(album.title)

    summary('albums', possible_titles(artist, title))
  end

  get "/artist/:id/summary" do
    artist = Artist[params[:id]]
    name = artist.wikipedia || wp_fix(artist.name)
    summary('artists', possible_names(name))
  end

  get '/track/:id/summary' do
    track = Track[params[:id]]
    title = track.wikipedia || wp_fix(track.title)
    summary('tracks', possible_songs(track.artist, title))
  end


  get "/summary/:category/:search" do
    lookup(params[:category], params[:search])
  end

#  get "/stats" do
#    haml :stats, layout: !request.xhr?
#  end

  get "/stats" do
    @title = "Stats - Bemused"
    @react_page = "stats"
    haml :spa_layout
  end

  get "/stats/albums" do
    content_type :json
    Album.stats.to_json
  end

  get "/stats/artists" do
    content_type :json
    Artist.stats.to_json
  end

  get "/stats/tracks" do
    content_type :json
    Track.stats.to_json
  end

  get "/stats/logs" do
    content_type :json
    Log.stats.to_json
  end

  get "/meta" do
    query = params[:q] || ""
    tracks = query.length >= 2 ? Track.where(Sequel.ilike(Sequel.function(:f_unaccent, :title), "%#{query}%")) : []
    albums = query.length >= 2 ? Album.where(Sequel.ilike(Sequel.function(:f_unaccent, :title), "%#{query}%")) : []
    artists = query.length >= 2 ? Artist.where(Sequel.ilike(Sequel.function(:f_unaccent, :name), "%#{query}%")) : []
    haml :meta, layout: !request.xhr?, locals: { tracks: tracks, albums: albums, artists: artists }
  end

end
