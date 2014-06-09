class Bemused < Sinatra::Application
  get "/" do
    haml :index
  end
end
