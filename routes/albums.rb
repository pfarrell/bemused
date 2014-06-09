class Bemused < Sinatra::Application
  get "/album/:id" do
    haml :album, :locals => {:album => Album[params[:id]]} 
  end
end
