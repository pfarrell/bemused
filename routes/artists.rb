class Bemused < Sinatra::Application
  get "/artist/:id" do
    haml :artist, :locals => {:artist=> Artist[params[:id]]} 
  end

  get "/admin/artist/:id" do
    haml :"admin/model", locals: {model: Artist[params[:id]]}
  end

  post "/admin/artist/:id" do
    params["name"]
  end
end
