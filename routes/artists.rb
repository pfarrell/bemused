require 'open-uri'

class Bemused < Sinatra::Application
  get "/artist/:id" do
    haml :artist, :locals => {:artist=> Artist[params[:id]]} 
  end

  get "/admin/artist/:id" do
    haml :"admin/artist", locals: {model: Artist[params[:id]]}
  end

  post "/admin/artist/:id" do
    artist = Artist[params[:id]].merge_params(params)
    artist.save
    haml :artist, locals: {artist: artist}
  end

  post "/admin/artist/:id/image" do
    artist = Artist[params[:id]]
    open("#{params[:image_url]}") {|f|
      File.open("public/images/artists/#{params[:image_name]}", "wb") do |file|
        file.puts f.read
      end
    }
    artist.image_path="#{params[:image_name]}"
    artist.save
    redirect(url_for("/admin/artist/#{artist.id}"))
  end
end
