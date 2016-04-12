class Bemused < Sinatra::Application
  get "/" do
    tag = nil
    context = params[:tag]
    if(params[:tag])
      tag = Tag.find(name: params[:tag])
    end
    artists = context ? Artist.where(tags: tag) : Artist
    haml :index, locals: {artists: artists.exclude(image_path: nil).order(Sequel.lit('RANDOM()')).limit(25)}
  end
end
