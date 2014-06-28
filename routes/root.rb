class Bemused < Sinatra::Application
  get "/" do
    puts "x_mobile_device: #{request.env['X_MOBILE_DEVICE']}"
    haml :index, locals: {artists: Artist.exclude(image_path: nil).order(Sequel.lit("RAND()")).limit(25)}
  end
end
