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
    words= params[:size] || 100
    Track.words(:title, words).to_json
  end

end
