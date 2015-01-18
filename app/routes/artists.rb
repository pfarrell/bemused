# encoding 'utf-8'
require 'open-uri'
require 'json'

class Bemused < Sinatra::Application
  get "/artist/:id" do
    haml :artist, :locals => {:artist=> Artist[params[:id]]} 
  end

  get "/admin/artist/:id" do
    haml :"admin/artist", locals: {model: Artist[params[:id]]}
  end

  get "/artists" do 
    artists = Artist.where(Sequel.ilike(:name, "%#{params[:q]}")).limit(10).map{|a| a.name}
    respond_to do | wants|
      wants.json { artists.to_json }
    end
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

  post "/admin/artist/merge/:id" do
    old_artist = Artist[params[:id]]
    new_artist = Artist[params[:new_artist_id]]

    old_artist.albums.each do |album|
      album.artist = new_artist
      album.save
    end
    redirect(url_for("/admin/artist/#{new_artist.id}"))
  end

  get "/artists/words" do
    words= params[:size] || 100
    data = Artist.words(words, :name)
    respond_to do |wants|
      wants.json{ 
        data.to_json
      }
      wants.html{ 
        props={}
        props["word"] = {value: lambda{|x| x[0]}}
        props["count"] = {value: lambda{|x| x[1]}}
        haml :nonpaginatedlist, locals: {header:props, data: data}
      }
    end
  end
end
