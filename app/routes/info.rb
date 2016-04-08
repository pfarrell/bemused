class Bemused < Sinatra::Application

  def possible_titles(artist, title)
    ["#{title} (#{artist} album)", "#{title} (album)", title]
  end

  def possible_names(name)
    ["#{name} (band)", name]
  end

  def summary(category, searches)
    searches.each do |search|
      summary = lookup(category, search)
      return summary unless summary.nil?
    end
  end

  def lookup(category, search)
    begin
      settings.info.summary(category, search)
    rescue Exception => ex
      nil
    end
  end

  def wp_fix(title)
    [['At', 'at'], ['The', 'the'], ['Of', 'of']].each do |arr|
      title = fix(title, arr[0], arr[1])
    end
    title
  end

  def fix(string, match, replace)
    string.gsub(/\b#{match}\b/, replace)
  end

  get "/album/:id/summary" do
    album = Album[params[:id]]
    artist = album.artist.wikipedia || album.artist.name
    title = album.wikipedia || wp_fix(album.title)

    summary('albums', possible_titles(artist, title))
  end

  get "/artist/:id/summary" do
    artist = Artist[params[:id]]
    name = artist.wikipedia || wp_fix(artist.name)
    summary('artists', possible_names(name))
  end

  get "/summary/:category/:search" do
    lookup(params[:category], params[:search])
  end

end
