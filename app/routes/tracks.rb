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
    "track saved"
  end

  get "/tracks/words" do
    respond_to do |wants|
      wants.json{ 
        words= params[:size] || 100
        Track.words(:title, words).to_json
      }
      wants.html{ redirect url_for("/tracks/words/1") }
    end
  end


  get "/tracks/words/:page" do
    page = params[:page].to_i
    words= params[:size] || 100
    data = Track.words(:title, words)
    respond_to do |wants|
      wants.html{ 
        props={}
        props["word"] = {value: lambda{|x| x[0]}}
        props["count"] = {value: lambda{|x| x[1]}}
        haml :list, locals: {header:props, data: data, nxt: page + 1, prev: page - 1}
      }
      wants.json{ 
        hsh={}
        hsh["prev"] = "/tracks/words/#{page-1}"
        hsh["nxt"] = "/tracks/words/#{page+1}"
        hsh["data"] = data
        hsh.to_json
      }
    end
  end

end
