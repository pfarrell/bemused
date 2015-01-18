require 'open-uri'

class Bemused < Sinatra::Application

  def shorten(str, len=50)
    str.length > len ? "#{str[0,len]}..." : str
  end
  
  get "/album/:id" do
    haml :album, locals: {album: Album[params[:id]]} 
  end

  get "/admin/album/:id" do
    haml :"admin/album", locals: {model: Album[params[:id]]}
  end

  post "/admin/album/:id" do
    album = Album[params[:id]].merge_params(params)
    album.save
    haml :album, locals: {album: album}
  end

  post "/admin/album/:id/image" do
    album = Album[params[:id]]
    open("#{params[:image_url]}") {|f|
      File.open("public/images/#{params[:image_name]}", "wb") do |file|
        file.puts f.read
      end
    }
    album.image_path="#{params[:image_name]}"
    album.save
    redirect(url_for("/admin/album/#{album.id}"))
  end

  post "/admin/album/merge/:id" do
    old_album = Album[params[:id]]
    new_album = Album[params[:new_album_id]]

    old_album.tracks.each do |track|
      track.album = new_album
      track.save_changes
    end
    redirect(url_for("/admin/album/#{new_album.id}"))
  end

  get "/albums/recent" do 
    redirect url_for("/albums/recent/1")
  end

  get "/albums/recent/:page" do
     page = params[:page].to_i
     haml :recent_albums, locals: {albums: Album.order(Sequel.desc(:id)).paginate(page, 24), nxt: page + 1, prev: page - 1}
  end

  get "/albums/words" do
    words= params[:size] || 100
    data = Album.words(words, :title)
    respond_to do |wants|
      wants.json { data.do_json }
      wants.html {
        props={}
        props["word"] = {value: lambda{|x| x[0]}}
        props["count"] = {value: lambda{|x| x[1]}}
        haml :nonpaginatedlist, locals: {header: props, data: data}
      }
    end
  end
end
