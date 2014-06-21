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
    redirect("/admin/album/#{album.id}")
  end
end
