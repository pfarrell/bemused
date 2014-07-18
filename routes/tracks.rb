class Bemused < Sinatra::Application
  get "/track" do
    "hello from track"
  end

  get "/tracks" do
    query = params[:q] || ""
    redirect(url_for("/#{query[1..-1]}")) if query =~ /^\//
    tracks = Track.where(Sequel.ilike(:title, "%#{query}%")) if query.length > 1
    haml :tracks, locals: {
      :tracks => tracks || []
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
end
