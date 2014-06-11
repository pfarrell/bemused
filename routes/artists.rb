class Bemused < Sinatra::Application
  get "/artist/:id" do
    haml :artist, :locals => {:artist=> Artist[params[:id]]} 
  end
end
