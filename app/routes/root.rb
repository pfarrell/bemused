class Bemused < Sinatra::Application
  get "/" do
    haml :index, locals: {artists: Artist.exclude(image_path: nil).order(Sequel.lit("RAND()")).limit(25)}
  end
end
