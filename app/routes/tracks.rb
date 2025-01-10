class Bemused < Sinatra::Application
  def track_from_params(params)
    Track[params[:id]]
  end

  get "/track/random" do
    Track.random.to_json
  end

  get "/track/active" do
  end

  %w(get post).each do |meth|
    send meth, "/tracks" do
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
  end

  get "/admin/track/:id" do
    haml :"admin/model", locals: {model: track_from_params(params)}
  end

  post "/admin/track/:id" do
    track = Track[params[:id]].merge_params(params)
    track.save
    haml :"admin/model", locals: {model: track_from_params(params)}
  end

  post "/track/:id/favorite" do
    content_type :json
    if current_user
      track = track_from_params(params)
      favorite = FavoriteTrack.find_or_create(target_id: track.id, user_id: current_user.id)
    else
      favorite = {}
    end
    respond_to do |wants|
      wants.json { favorite.to_json }
    end
  end

  delete "/admin/track/:id" do
    track_from_params(params).destroy
  end

  delete '/track/:id/favorite' do
    content_type :json
    favorites = [{}]
    if current_user
      favorites = FavoriteTrack.where(user_id: current_user.id, target_id: params[:id]).map(&:destroy)
    end
    respond_to do |wants|
      wants.json { favorites.first.to_json }
    end
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
