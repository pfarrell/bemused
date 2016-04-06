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
      Info.summary(search)
    rescue
      nil
    end
  end

  get "/album/:id/summary" do
    album = Album[params[:id]]
    artist = album.artist.wikipedia || album.artist.name
    title = album.wikipedia || album.title
    summary(possible_titles(artist, title))
  end

  get "/summary/:search" do
    Info.summary(params[:search])
  end

end
