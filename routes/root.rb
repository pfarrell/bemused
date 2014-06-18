class Bemused < Sinatra::Application
  get "/" do
    puts "x_mobile_device: #{request.env['X_MOBILE_DEVICE']}"
    haml :index
  end
end
