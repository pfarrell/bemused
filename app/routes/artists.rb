# encoding 'utf-8'
require 'open-uri'
require 'json'

class Bemused < Sinatra::Application

  def summarize_artist(artist)
    name = (artist.wikipedia and !artist.wikipedia.empty?) ? artist.wikipedia : wp_fix(artist[:name])
    summ = summary('artists', possible_names(name))
    !summ.empty? ?  JSON.parse(summ) : {}
  end

  get "/artist/:id" do
    page = (params[:page] || 1).to_i
    artist = Artist[params[:id]]
    summary = summarize_artist(artist)
    albums = Album.where(artist_id: artist.id).qualify.association_join(:tracks).select_all(:albums).distinct
    haml :artist, layout: !request.xhr?, locals: {artist: artist, summary: summary, albums: albums}
  end

  get "/admin/artist/:id" do
    haml :"admin/artist", layout: !request.xhr?, locals: { model: Artist[params[:id]] }
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
    haml :'admin/artist', layout: !request.xhr?, locals: {model: artist}
  end

  post "/admin/artist/:id/image" do
    artist = Artist[params[:id]]
    URI.open("#{params[:image_url]}") {|f|
      File.open("public/images/artists/#{params[:image_name]}", "wb") do |file|
        file.puts f.read
      end
    }
    artist.image_path="#{params[:image_name]}"
    artist.save
    redirect(url_for("/admin/artist/#{artist.id}"))
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
        haml :nonpaginatedlist, layout: !request.xhr?, locals: {header:props, data: data}
      }
    end
  end

  delete "/admin/artist/:id/tag/:tag_id" do
    artist = Artist[params[:id]]
    tag = Tag[params[:tag_id]]
    artist.remove_tag(tag)
    respond_to do |wants|
     wants.json{ {"status" => "OK"}.to_json }
     wants.js{ } #AJAX calls
    end
  end

  put "/artist/:id/tags" do
    tag = Tag.find_or_create(name: params[:tag])
    artist = Artist[params[:id]]
    unless artist.tags.include?(tag)
      artist.add_tag(tag)
      artist.save
    end
  end

  get "/artists/random" do
    content_type :json
    count = params[:size] || 10
    random_artists(count).to_json
  end
end
