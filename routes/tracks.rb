class Bemused < Sinatra::Application
  get "/track" do
    "hello from track"
  end

  get "/admin/track/:id" do
    haml :"admin/model", locals: {model: Track[params[:id]]}
  end

  post "/admin/track/:id" do
    params["title"]
  end
end
