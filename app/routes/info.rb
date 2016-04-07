class Bemused < Sinatra::Application

  def possible_titles(artist, title)
    ["#{title} (#{artist} album)", "#{title} (album)", title]
  end

  def summary(searches)
    searches.each do |search|
      summary = lookup(search)
      return summary unless summary.nil?
    end
  end

  def lookup(search)
    begin
      settings.info.summary(search)
    rescue Exception => ex
      nil
    end
  end

  def wp_fix(title)
    [['At', 'at'], ['The', 'the']].each do |arr|
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

    summary(possible_titles(artist, title))
  end

  get "/summary/:search" do
    lookup(params[:search])
  end

end
