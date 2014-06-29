require 'open-uri'

class Bemused < Sinatra::Application
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
      track.save
    end
    redirect(url_for("/admin/album/#{new_album.id}"))
  end
end
