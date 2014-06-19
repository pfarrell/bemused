class Bemused < Sinatra::Application
  get "/album/:id" do
    haml :album, :locals => {:album => Album[params[:id]]} 
  end

  get "/admin/album/:id" do
    haml :"admin/model", locals: {model: Album[params[:id]]}
  end

  post "/admin/album/:id" do
    params["title"]
  end
end
