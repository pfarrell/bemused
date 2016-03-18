class Bemused < Sinatra::Application
  get "/track/random" do
    Track.random.to_json
  end

  get "/track/active" do
  end

  get "/tracks" do
    query = params[:q] 
    redirect(url_for("/#{query[1..-1]}")) if query =~ /^\//
    redirect(url_for("/")) if query == ""
    tracks = Track.where(Sequel.ilike(:title, "%#{query}%")) if !query.nil? && query.length > 1
    album = Album.new
    unless tracks.nil?
      album.title = query
      tracks.each_with_index do |track, i| 
        track.track_number = i + 1
        album.tracks << track 
      end
    end
    haml :tracks, locals: {
      :tracks => tracks || [],
      :album => album
    }
  end  

  get "/admin/track/:id" do
    haml :"admin/model", locals: {model: Track[params[:id]]}
  end

  post "/admin/track/:id" do
    track = Track[params[:id]].merge_params(params)
    track.save
    haml :"admin/model", locals: {model: Track[params[:id]]}
  end

  get "/tracks/words" do
    words= params[:size] || 100
    data = Track.words(words, :title)
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
