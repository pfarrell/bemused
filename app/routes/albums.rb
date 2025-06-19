require 'open-uri'

class Bemused < Sinatra::Application

  def summarize_album(album)
    artist_name = (album.artist.wikipedia and !album.artist.wikipedia.empty?) ? album.artist.wikipedia : wp_fix(album.artist[:name])
    name = (album.wikipedia and !album.wikipedia.empty?) ? album.wikipedia : wp_fix(album[:title])
    summ = summary('albums', possible_titles(artist_name, name))
    !summ.empty? ?  JSON.parse(summ) : {}
  end

  def shorten(str, len=50)
    str.length > len ? "#{str[0,len]}..." : str
  end

  get "/album/:id" do
    album = Album[params[:id]]
    summary = summarize_album(album)
    data = {album: album, summary: summary, tracks: album.tracks}
    respond_to do |wants|
      wants.html { haml :album, layout: !request.xhr?, locals: data }
      wants.json { data.to_json }
    end
  end

  get "/admin/album/:id" do
    haml :"admin/album", layout: !request.xhr?, locals: { base_url: url_for("/admin/album/#{params[:id]}"), model: Album[params[:id]] }
  end

  post "/admin/album/:id" do
    album = Album[params[:id]].merge_params(params)
    album.save

    respond_to do |wants|
      wants.js { album.to_json }
      wants.html { haml :album, layout: !request.xhr?, locals: {album: album} }
    end
  end

  delete "/album/:id/tag/:tag_id" do
    album = Album[params[:id]]
    tag = Tag[params[:tag_id]]
    album.remove_tag(tag)
    respond_to do |wants|
     wants.json{ {"status" => "OK"}.to_json }
     wants.js{ } #AJAX calls
    end
  end

  put "/album/:id/tags" do
    tag = Tag.find(name: params[:tag])
    album = Album[params[:id]]
    unless album.tags.include?(tag)
      album.add_tag(tag)
      album.save
    end
  end

  patch "/admin/album/:id/tracks" do
    content_type :json
    album = Album[params[:id]]
    album.tracks.each do |track|
      track.merge_params(params)
      track.save
    end
    Album[params[:id]].to_json
  end

  post "/admin/album/:id/image" do
    album = Album[params[:id]]
    URI.open("#{params[:image_url]}") {|f|
      File.open("public/images/albums/#{params[:image_name]}", "wb") do |file|
        file.puts f.read
      end
    }
    album.image_path="#{params[:image_name]}"
    album.save
    redirect(url_for("/admin/album/#{album.id}"))
  end

  get "/albums/recent" do
    redirect url_for("/albums/recent/1")
  end

  get "/albums/recent/:page" do
     page = params[:page].to_i
     haml :recent_albums, layout: !request.xhr?, locals: {model: {data: Album.order(Sequel.desc(:id)).paginate(page, 24)}}
  end

  get "/albums/words" do
    words= params[:size] || 100
    data = Album.words(words, :title)
    respond_to do |wants|
      wants.json { data.to_json }
      wants.html {
        props={}
        props["word"] = {value: lambda{|x| x[0]}}
        props["count"] = {value: lambda{|x| x[1]}}
        haml :nonpaginatedlist, layout: !request.xhr?, locals: {header: props, data: data}
      }
    end
  end
end
